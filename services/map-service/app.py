"""Synaptic | Interactive healthcare travel-time accessibility map.

Run with:
    python3 -m pip install -r requirements_healthcare_access.txt
    streamlit run synaptic_healthcare_access_app.py

Routing notes:
- Driving, walking, and cycling use the public Valhalla demo service.
- Public transit is optional and requires a Google Maps Directions API key
  with billing/API access enabled, supplied as GOOGLE_MAPS_API_KEY or in the UI.
- Public routing demos have fair-use limits. This app routes only a shortlist
  of nearby facilities, not the entire 11,625-row dataset.
"""

from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Any

import folium
import pandas as pd
import requests
import streamlit as st
from streamlit_folium import st_folium

APP_DIR = Path(__file__).resolve().parent
CSV_CANDIDATES = [
    APP_DIR / "health_location.csv",
    APP_DIR / "healthcare_facilities.csv.csv",
    Path("/Users/sonakshibilas/Desktop/Synaptic-HTV 11/synaptic/.vscode/health_location.csv"),
    Path("/Users/sonakshibilas/Desktop/Synaptic-HTV 11/synaptic/.vscode/healthcare_facilities.csv.csv"),
]
VALHALLA_BASE = "https://valhalla1.openstreetmap.de"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
USER_AGENT = "SynapticHealthcareAccessMap/1.0 (educational research project)"

MODE_CONFIG = {
    "Driving": {"costing": "auto", "label": "Driving"},
    "Walking": {"costing": "pedestrian", "label": "Walking"},
    "Cycling": {"costing": "bicycle", "label": "Cycling"},
}
MODE_COLORS = {"Driving": "#2463EB", "Walking": "#0F9D58", "Cycling": "#8B5CF6", "Public transit": "#D97706"}

st.set_page_config(page_title="Synaptic | Healthcare Access", page_icon="🩺", layout="wide")
st.markdown(
    """
    <style>
    .block-container {padding-top: 1.6rem; padding-bottom: 2rem;}
    .synaptic-kicker {letter-spacing: .13em; text-transform: uppercase; font-size: .78rem; color: #64748b; font-weight: 700;}
    </style>
    """,
    unsafe_allow_html=True,
)


def normalize_column(value: Any) -> str:
    return "".join(ch.lower() for ch in str(value) if ch.isalnum())


def find_column(columns: list[str], aliases: list[str]) -> str | None:
    normalized = {normalize_column(col): col for col in columns}
    for alias in aliases:
        key = normalize_column(alias)
        if key in normalized:
            return normalized[key]
    for col in columns:
        key = normalize_column(col)
        if any(normalize_column(alias) in key for alias in aliases):
            return col
    return None


@st.cache_data(show_spinner=False)
def load_facilities(csv_path: str, mtime: float) -> tuple[pd.DataFrame, str]:
    del mtime  # included in the cache key so edits to the CSV reload it
    frame = pd.read_csv(csv_path, encoding="utf-8-sig", low_memory=False)
    frame.columns = [str(c).replace("\ufeff", "").replace("ï»¿", "").strip() for c in frame.columns]

    lon_col = find_column(list(frame.columns), ["X", "longitude", "lon", "lng"])
    lat_col = find_column(list(frame.columns), ["Y", "latitude", "lat"])
    name_col = find_column(list(frame.columns), ["ENGLISH_NAME", "facility_name", "name"])
    type_col = find_column(list(frame.columns), ["SERVICE_TYPE", "facility_type", "type", "category"])
    community_col = find_column(list(frame.columns), ["COMMUNITY", "city", "municipality"])
    postal_col = find_column(list(frame.columns), ["POSTAL_CODE", "postal_code", "postal"])

    if not lon_col or not lat_col:
        raise ValueError(f"Could not identify longitude/latitude columns. Found: {list(frame.columns)}")

    frame["_longitude"] = pd.to_numeric(frame[lon_col], errors="coerce")
    frame["_latitude"] = pd.to_numeric(frame[lat_col], errors="coerce")
    frame = frame.dropna(subset=["_longitude", "_latitude"]).copy()
    frame = frame[frame["_latitude"].between(41, 84) & frame["_longitude"].between(-142, -50)].copy()
    frame["_facility_name"] = frame[name_col].fillna("Unnamed facility").astype(str) if name_col else "Unnamed facility"
    frame["_facility_type"] = frame[type_col].fillna("Unspecified").astype(str) if type_col else "Unspecified"
    frame["_community"] = frame[community_col].fillna("").astype(str) if community_col else ""
    frame["_postal_code"] = frame[postal_col].fillna("").astype(str) if postal_col else ""
    return frame.reset_index(drop=True), f"{len(frame):,} facilities loaded"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@st.cache_data(ttl=86400, show_spinner=False)
def geocode_address(address: str) -> tuple[float, float, str]:
    response = requests.get(
        NOMINATIM_URL,
        params={"q": address, "format": "jsonv2", "limit": 1, "countrycodes": "ca"},
        headers={"User-Agent": USER_AGENT},
        timeout=20,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise ValueError("No matching Canadian address was found. Try adding the city and province or a postal code.")
    return float(results[0]["lat"]), float(results[0]["lon"]), str(results[0].get("display_name", address))


def parse_valhalla_matrix(payload: dict[str, Any], target_count: int) -> list[tuple[float | None, float | None]]:
    matrix = payload.get("sources_to_targets") or payload.get("sourcesToTargets")
    if not matrix:
        raise ValueError(payload.get("error", "Routing service returned no matrix"))
    # Valhalla normally returns one row per source, containing one item per target.
    row = matrix[0] if isinstance(matrix[0], list) else matrix
    parsed: list[tuple[float | None, float | None]] = []
    for item in row[:target_count]:
        if not isinstance(item, dict) or item.get("time") is None:
            parsed.append((None, None))
        else:
            # Valhalla matrix distance is in the requested units (kilometers here).
            parsed.append((float(item["time"]) / 60.0, float(item.get("distance", 0.0))))
    parsed.extend([(None, None)] * (target_count - len(parsed)))
    return parsed


@st.cache_data(ttl=3600, show_spinner=False)
def valhalla_matrix(origin_lat: float, origin_lon: float, targets: tuple[tuple[float, float], ...], costing: str) -> list[tuple[float | None, float | None]]:
    if not targets:
        return []
    payload = {
        "sources": [{"lat": origin_lat, "lon": origin_lon}],
        "targets": [{"lat": lat, "lon": lon} for lat, lon in targets],
        "costing": costing,
        "units": "kilometers",
    }
    headers = {"User-Agent": USER_AGENT, "X-Client-Id": "synaptic-healthcare-access-map"}
    response = requests.post(f"{VALHALLA_BASE}/sources_to_targets", json=payload, headers=headers, timeout=45)
    response.raise_for_status()
    return parse_valhalla_matrix(response.json(), len(targets))


@st.cache_data(ttl=3600, show_spinner=False)
def google_transit_route(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float, api_key: str) -> tuple[float | None, float | None, str | None]:
    if not api_key:
        return None, None, "Add a Google Maps API key to calculate transit times."
    response = requests.post(
        GOOGLE_ROUTES_URL,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
            "User-Agent": USER_AGENT,
        },
        json={
            "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lon}}},
            "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lon}}},
            "travelMode": "TRANSIT",
            "departureTime": pd.Timestamp.now(tz="UTC").isoformat(timespec="seconds").replace("+00:00", "Z"),
        },
        timeout=25,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("routes"):
        return None, None, str(data.get("error", {}).get("message") or "No transit route returned")
    route = data["routes"][0]
    duration_text = str(route.get("duration", "0s"))
    duration_seconds = float(duration_text[:-1]) if duration_text.endswith("s") else float(duration_text)
    return duration_seconds / 60.0, float(route.get("distanceMeters", 0.0)) / 1000.0, None


def time_band(minutes: float | None) -> tuple[str, str]:
    if minutes is None or pd.isna(minutes):
        return "No route", "#64748B"
    if minutes <= 5:
        return "0–5 min", "#16803C"
    if minutes <= 10:
        return "5–10 min", "#2563EB"
    if minutes <= 15:
        return "10–15 min", "#D97706"
    return "15+ min", "#DC2626"


def add_facility_popup(row: pd.Series, modes: list[str]) -> str:
    parts = [f"<b>{row['_facility_name']}</b>", f"Type: {row['_facility_type']}"]
    if row.get("_community"):
        parts.append(f"Community: {row['_community']}")
    if row.get("_postal_code"):
        parts.append(f"Postal code: {row['_postal_code']}")
    parts.append(f"Straight-line distance: {row['straight_line_km']:.1f} km")
    for mode in modes:
        mins = row.get(f"{mode}_minutes")
        km = row.get(f"{mode}_km")
        if pd.notna(mins):
            parts.append(f"{mode}: {mins:.0f} min ({km:.1f} km routed)")
        else:
            parts.append(f"{mode}: unavailable")
    return "<br>".join(parts)


st.markdown('<div class="synaptic-kicker">SYNAPTIC · HEALTHCARE INTELLIGENCE</div>', unsafe_allow_html=True)
st.title("Healthcare travel-time accessibility")
st.write("Explore nearby healthcare facilities by estimated travel time, compare travel modes, and identify service gaps.")

csv_path = next((p for p in CSV_CANDIDATES if p.exists()), None)
with st.sidebar:
    st.header("Map settings")
    if csv_path is None:
        custom_csv = st.text_input("CSV file path", value=str(APP_DIR / "health_location.csv"))
        st.caption("The app looked for health_location.csv and healthcare_facilities.csv.csv beside this script and in your project folder.")
        csv_path = Path(custom_csv).expanduser()
    else:
        st.caption(f"Dataset: `{csv_path.name}`")
    origin_text = st.text_input("Starting address or postal code", placeholder="e.g. 100 Queen St W, Toronto, ON")
    radius_km = st.slider("Search radius (straight-line prefilter)", min_value=2, max_value=50, value=20, step=2)
    max_candidates = st.select_slider("Facilities to route per method", options=[10, 15, 20, 25, 30], value=20)
    api_key = st.text_input(
        "Google Maps API key (optional; enables transit)",
        value=os.getenv("GOOGLE_MAPS_API_KEY", ""),
        type="password",
        help="Enable the Google Maps Routes API and billing for transit estimates. The key is used only for this app session.",
    )
    st.caption("Travel times are estimates. Routing services may be rate-limited; the shortlist keeps requests manageable.")

if not csv_path.exists():
    st.error(f"CSV not found: {csv_path}. Update the path in the sidebar or place the CSV beside this app.")
    st.stop()

try:
    facilities, load_message = load_facilities(str(csv_path.resolve()), csv_path.stat().st_mtime)
except Exception as exc:
    st.error(f"Could not load the CSV: {exc}")
    st.stop()

metric1, metric2, metric3 = st.columns(3)
metric1.metric("Facilities in dataset", f"{len(facilities):,}")
metric2.metric("Facility categories", f"{facilities['_facility_type'].nunique():,}")
metric3.metric("Coordinate fields", "X = longitude · Y = latitude")

all_types = sorted(facilities["_facility_type"].dropna().unique().tolist())
selected_types = st.multiselect("Facility types", options=all_types, default=all_types)
selected_modes = st.multiselect("Compare travel methods", options=["Driving", "Walking", "Cycling", "Public transit"], default=["Driving", "Walking", "Cycling"])
if not selected_modes:
    st.info("Select at least one travel method.")

calculate = st.button("Calculate nearby healthcare access", type="primary", disabled=not origin_text.strip() or not selected_modes)
if calculate:
    try:
        with st.spinner("Finding your starting point…"):
            origin_lat, origin_lon, resolved_address = geocode_address(origin_text.strip())
        working = facilities[facilities["_facility_type"].isin(selected_types)].copy()
        working["straight_line_km"] = working.apply(
            lambda row: haversine_km(origin_lat, origin_lon, float(row["_latitude"]), float(row["_longitude"])),
            axis=1,
        )
        working = working[working["straight_line_km"] <= radius_km].sort_values("straight_line_km").head(max_candidates).copy()
        if working.empty:
            st.session_state.pop("synaptic_results", None)
            st.warning("No facilities matched the selected types within that radius. Increase the radius or broaden the type filter.")
        else:
            coords = tuple((float(row["_latitude"]), float(row["_longitude"])) for _, row in working.iterrows())
            route_errors: list[str] = []
            for mode in selected_modes:
                working[f"{mode}_minutes"] = None
                working[f"{mode}_km"] = None
                if mode in MODE_CONFIG:
                    try:
                        with st.spinner(f"Calculating {mode.lower()} routes for {len(working)} facilities…"):
                            values = valhalla_matrix(origin_lat, origin_lon, coords, MODE_CONFIG[mode]["costing"])
                        working[f"{mode}_minutes"] = [v[0] for v in values]
                        working[f"{mode}_km"] = [v[1] for v in values]
                    except Exception as exc:
                        route_errors.append(f"{mode}: {exc}")
                elif mode == "Public transit":
                    if not api_key:
                        route_errors.append("Public transit: enter a Google Maps API key in the sidebar to enable transit estimates.")
                    else:
                        mins_values, km_values = [], []
                        progress = st.progress(0, text="Calculating public-transit routes…")
                        for i, (_, row) in enumerate(working.iterrows(), start=1):
                            try:
                                mins, km, error = google_transit_route(
                                    origin_lat, origin_lon, float(row["_latitude"]), float(row["_longitude"]), api_key
                                )
                                mins_values.append(mins)
                                km_values.append(km)
                                if error:
                                    route_errors.append(f"Transit to {row['_facility_name']}: {error}")
                            except Exception as exc:
                                mins_values.append(None)
                                km_values.append(None)
                                route_errors.append(f"Transit to {row['_facility_name']}: {exc}")
                            progress.progress(i / len(working), text=f"Calculating public-transit routes… {i}/{len(working)}")
                        progress.empty()
                        working[f"{mode}_minutes"] = mins_values
                        working[f"{mode}_km"] = km_values

            st.session_state["synaptic_results"] = {
                "facilities": working,
                "origin": (origin_lat, origin_lon),
                "address": resolved_address,
                "modes": selected_modes,
                "route_errors": route_errors,
                "radius_km": radius_km,
            }
    except Exception as exc:
        st.error(f"Could not calculate accessibility: {exc}")

results = st.session_state.get("synaptic_results")
if results:
    data = results["facilities"].copy()
    origin_lat, origin_lon = results["origin"]
    modes = results["modes"]
    st.subheader("Results")
    st.caption(f"Starting point: {results['address']}")

    primary_mode = st.selectbox("Colour markers by travel time", options=modes, index=0)
    minutes_col = f"{primary_mode}_minutes"
    reachable_5 = int((pd.to_numeric(data[minutes_col], errors="coerce") <= 5).sum()) if minutes_col in data else 0
    reachable_10 = int((pd.to_numeric(data[minutes_col], errors="coerce") <= 10).sum()) if minutes_col in data else 0
    reachable_15 = int((pd.to_numeric(data[minutes_col], errors="coerce") <= 15).sum()) if minutes_col in data else 0
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Facilities routed", len(data))
    c2.metric("Within 5 min", reachable_5)
    c3.metric("Within 10 min", reachable_10)
    c4.metric("Within 15 min", reachable_15)

    map_obj = folium.Map(location=[origin_lat, origin_lon], zoom_start=12, control_scale=True, tiles="OpenStreetMap")
    folium.Marker(
        [origin_lat, origin_lon],
        tooltip="Selected starting point",
        popup=f"<b>Starting point</b><br>{results['address']}",
        icon=folium.Icon(color="black", icon="home", prefix="fa"),
    ).add_to(map_obj)

    for _, row in data.iterrows():
        mins = pd.to_numeric(pd.Series([row.get(minutes_col)]), errors="coerce").iloc[0]
        band, color = time_band(None if pd.isna(mins) else float(mins))
        popup = folium.Popup(add_facility_popup(row, modes), max_width=340)
        folium.CircleMarker(
            location=[float(row["_latitude"]), float(row["_longitude"])],
            radius=6,
            color=color,
            weight=1,
            fill=True,
            fill_color=color,
            fill_opacity=0.85,
            tooltip=f"{row['_facility_name']} · {band}",
            popup=popup,
        ).add_to(map_obj)

    legend_html = """
    <div style="position: fixed; bottom: 28px; left: 24px; z-index: 9999; background: white;
                padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px;">
      <b>Travel-time bands</b><br>
      <span style="color:#16803C">●</span> 0–5 min<br>
      <span style="color:#2563EB">●</span> 5–10 min<br>
      <span style="color:#D97706">●</span> 10–15 min<br>
      <span style="color:#DC2626">●</span> 15+ min<br>
      <span style="color:#64748B">●</span> No route available
    </div>
    """
    map_obj.get_root().html.add_child(folium.Element(legend_html))
    st_folium(map_obj, use_container_width=True, height=590, returned_objects=[])

    display_cols = ["_facility_name", "_facility_type", "_community", "_postal_code", "straight_line_km"]
    rename_cols = {
        "_facility_name": "Facility",
        "_facility_type": "Type",
        "_community": "Community",
        "_postal_code": "Postal code",
        "straight_line_km": "Straight-line km",
    }
    for mode in modes:
        display_cols.extend([f"{mode}_minutes", f"{mode}_km"])
        rename_cols[f"{mode}_minutes"] = f"{mode} minutes"
        rename_cols[f"{mode}_km"] = f"{mode} routed km"
    display = data[display_cols].rename(columns=rename_cols).copy()
    display["Straight-line km"] = display["Straight-line km"].round(1)
    for col in display.columns:
        if col.endswith("minutes") or col.endswith("routed km"):
            display[col] = pd.to_numeric(display[col], errors="coerce").round(1)
    st.subheader("Nearby facilities")
    st.dataframe(display, use_container_width=True, hide_index=True)
    csv_bytes = display.to_csv(index=False).encode("utf-8-sig")
    st.download_button("Download results as CSV", data=csv_bytes, file_name="synaptic_healthcare_access_results.csv", mime="text/csv")

    if results["route_errors"]:
        with st.expander("Routing notes and unavailable routes"):
            for item in results["route_errors"][:30]:
                st.write(f"- {item}")
            if len(results["route_errors"]) > 30:
                st.write(f"…and {len(results['route_errors']) - 30} more messages.")

st.divider()
st.caption(
    "Methodology: nearby candidates are first shortlisted by straight-line distance, then travel times are requested from routing services. "
    "Times can vary with traffic, departure time, transit schedules, and map data. Public-transit times require a configured Google Maps Routes API key. "
    "This is an accessibility research tool, not an emergency-routing service. OpenStreetMap data © OpenStreetMap contributors."
)
