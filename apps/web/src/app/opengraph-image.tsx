import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Mockspec - Mock APIs in Minutes";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default function Image() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "#050507",
				fontFamily: "system-ui, sans-serif",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Subtle grid pattern - scientific precision */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage: `
						linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
						linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
					`,
					backgroundSize: "60px 60px",
				}}
			/>

			{/* Primary spectral glow - violet */}
			<div
				style={{
					position: "absolute",
					top: "-20%",
					left: "20%",
					width: "600px",
					height: "600px",
					background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)",
					borderRadius: "50%",
					filter: "blur(40px)",
				}}
			/>

			{/* Secondary spectral glow - blue */}
			<div
				style={{
					position: "absolute",
					bottom: "-30%",
					right: "10%",
					width: "500px",
					height: "500px",
					background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)",
					borderRadius: "50%",
					filter: "blur(60px)",
				}}
			/>

			{/* Tertiary accent - cyan whisper */}
			<div
				style={{
					position: "absolute",
					top: "40%",
					right: "30%",
					width: "300px",
					height: "300px",
					background: "radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 60%)",
					borderRadius: "50%",
					filter: "blur(30px)",
				}}
			/>

			{/* Horizontal precision lines */}
			<div
				style={{
					position: "absolute",
					top: "80px",
					left: "80px",
					right: "80px",
					height: "1px",
					background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2) 20%, rgba(139, 92, 246, 0.2) 80%, transparent)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "80px",
					left: "80px",
					right: "80px",
					height: "1px",
					background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15) 20%, rgba(59, 130, 246, 0.15) 80%, transparent)",
				}}
			/>

			{/* Corner markers - technical precision */}
			<div style={{ position: "absolute", top: "60px", left: "60px", display: "flex", flexDirection: "column" }}>
				<div style={{ width: "24px", height: "1px", background: "rgba(139, 92, 246, 0.4)" }} />
				<div style={{ width: "1px", height: "24px", background: "rgba(139, 92, 246, 0.4)" }} />
			</div>
			<div style={{ position: "absolute", top: "60px", right: "60px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
				<div style={{ width: "24px", height: "1px", background: "rgba(139, 92, 246, 0.4)" }} />
				<div style={{ width: "1px", height: "24px", background: "rgba(139, 92, 246, 0.4)", alignSelf: "flex-end" }} />
			</div>
			<div style={{ position: "absolute", bottom: "60px", left: "60px", display: "flex", flexDirection: "column-reverse" }}>
				<div style={{ width: "24px", height: "1px", background: "rgba(59, 130, 246, 0.3)" }} />
				<div style={{ width: "1px", height: "24px", background: "rgba(59, 130, 246, 0.3)" }} />
			</div>
			<div style={{ position: "absolute", bottom: "60px", right: "60px", display: "flex", flexDirection: "column-reverse", alignItems: "flex-end" }}>
				<div style={{ width: "24px", height: "1px", background: "rgba(59, 130, 246, 0.3)" }} />
				<div style={{ width: "1px", height: "24px", background: "rgba(59, 130, 246, 0.3)", alignSelf: "flex-end" }} />
			</div>

			{/* Central content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 10,
				}}
			>
				{/* Logo mark */}
				<div
					style={{
						width: "88px",
						height: "88px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
						marginBottom: "32px",
					}}
				>
					{/* Layered geometric forms */}
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
							borderRadius: "20px",
							transform: "rotate(12deg)",
							opacity: 0.9,
							boxShadow: "0 0 60px rgba(139, 92, 246, 0.4)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
							borderRadius: "20px",
							transform: "rotate(-12deg)",
							opacity: 0.7,
							boxShadow: "0 0 40px rgba(59, 130, 246, 0.3)",
						}}
					/>
					<div
						style={{
							width: "72px",
							height: "72px",
							background: "linear-gradient(145deg, #0a0a0c 0%, #12121a 100%)",
							borderRadius: "16px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 1,
							border: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						<svg
							width="38"
							height="38"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
						>
							<path d="M4 6h16M4 12h16M4 18h10" />
						</svg>
					</div>
				</div>

				{/* Product name - whispered typography */}
				<div
					style={{
						fontSize: "72px",
						fontWeight: 600,
						color: "#fafafa",
						letterSpacing: "-0.03em",
						marginBottom: "16px",
					}}
				>
					Mockspec
				</div>

				{/* Tagline - minimal, precise */}
				<div
					style={{
						fontSize: "24px",
						fontWeight: 400,
						color: "rgba(148, 163, 184, 0.9)",
						letterSpacing: "0.02em",
					}}
				>
					Mock APIs in Minutes
				</div>

				{/* Feature pills - sparse, clinical */}
				<div
					style={{
						display: "flex",
						gap: "24px",
						marginTop: "48px",
					}}
				>
					{["OpenAPI Import", "Chaos Engineering", "Team Collaboration"].map((feature) => (
						<div
							key={feature}
							style={{
								fontSize: "13px",
								fontWeight: 500,
								color: "rgba(148, 163, 184, 0.7)",
								letterSpacing: "0.05em",
								textTransform: "uppercase",
								padding: "8px 16px",
								border: "1px solid rgba(139, 92, 246, 0.2)",
								borderRadius: "6px",
								background: "rgba(139, 92, 246, 0.05)",
							}}
						>
							{feature}
						</div>
					))}
				</div>
			</div>

			{/* Bottom reference marker */}
			<div
				style={{
					position: "absolute",
					bottom: "32px",
					fontSize: "11px",
					fontWeight: 500,
					color: "rgba(100, 116, 139, 0.5)",
					letterSpacing: "0.1em",
					textTransform: "uppercase",
				}}
			>
				mockspec.dev
			</div>
		</div>,
		{ ...size }
	);
}
