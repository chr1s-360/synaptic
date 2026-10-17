export function SynapticLogo({ className = "h-9 w-auto" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 540 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Synaptic"
        >
            <defs>
                <linearGradient id="synapticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="45%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="pulseLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
            </defs>

            {/* Stylized Synaptic Neuron 'S' Emblem */}
            <g transform="translate(10, -5)">
                {/* Main spine curve of S */}
                <path
                    d="M135 48 C 110 30, 70 34, 62 66 C 54 94, 115 102, 102 134 C 92 158, 58 160, 38 142"
                    stroke="url(#synapticGrad)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Upper radiating axon dendrite branches */}
                <path d="M85 46 C 105 35, 125 35, 148 38" stroke="url(#synapticGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M102 55 C 122 52, 142 62, 158 64" stroke="url(#synapticGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M112 74 C 130 84, 142 98, 155 106" stroke="url(#synapticGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />

                {/* Upper terminal synaptic nodes */}
                <circle cx="152" cy="38" r="9" fill="url(#nodeGrad)" />
                <circle cx="163" cy="65" r="8" fill="url(#nodeGrad)" />
                <circle cx="158" cy="107" r="7.5" fill="url(#nodeGrad)" />

                {/* Lower radiating axon dendrite branches */}
                <path d="M78 126 C 58 136, 42 140, 22 140" stroke="url(#synapticGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M86 136 C 72 150, 54 163, 34 173" stroke="url(#synapticGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M96 140 C 90 160, 78 174, 62 184" stroke="url(#synapticGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" />

                {/* Lower terminal synaptic nodes */}
                <circle cx="16" cy="140" r="8.5" fill="url(#nodeGrad)" />
                <circle cx="30" cy="174" r="8" fill="url(#nodeGrad)" />
                <circle cx="62" cy="186" r="7.5" fill="url(#nodeGrad)" />
            </g>

            {/* Wordmark 'ynaptic' aligned with the 'S' spine */}
            <text
                x="172"
                y="126"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="82"
                fontWeight="600"
                letterSpacing="-1.5px"
                className="fill-slate-900 dark:fill-white"
                fill="currentColor"
            >
                ynaptic
            </text>

            {/* EKG / Heartbeat pulse underline */}
            <path
                d="M 192 148 L 305 148 L 315 160 L 325 136 L 335 156 L 342 148 L 475 148"
                stroke="url(#pulseLineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
