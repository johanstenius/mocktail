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
				background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{/* Glow effects */}
			<div
				style={{
					position: "absolute",
					top: "20%",
					left: "30%",
					width: "400px",
					height: "400px",
					background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
					borderRadius: "50%",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "20%",
					right: "30%",
					width: "300px",
					height: "300px",
					background: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
					borderRadius: "50%",
				}}
			/>

			{/* Logo */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "20px",
					marginBottom: "40px",
				}}
			>
				<div
					style={{
						width: "80px",
						height: "80px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							background: "#8b5cf6",
							borderRadius: "16px",
							transform: "rotate(12deg)",
							opacity: 0.8,
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							background: "#3b82f6",
							borderRadius: "16px",
							transform: "rotate(-12deg)",
							opacity: 0.6,
						}}
					/>
					<div
						style={{
							width: "64px",
							height: "64px",
							background: "#0a0a0a",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 1,
						}}
					>
						<svg
							width="36"
							height="36"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="2.5"
							strokeLinecap="round"
						>
							<path d="M4 6h16M4 12h16M4 18h10" />
						</svg>
					</div>
				</div>
				<span
					style={{
						fontSize: "64px",
						fontWeight: 700,
						color: "white",
						letterSpacing: "-0.02em",
					}}
				>
					Mockspec
				</span>
			</div>

			{/* Tagline */}
			<div
				style={{
					fontSize: "48px",
					fontWeight: 600,
					color: "white",
					marginBottom: "16px",
					textAlign: "center",
				}}
			>
				Mock APIs in Minutes
			</div>

			{/* Description */}
			<div
				style={{
					fontSize: "24px",
					color: "#94a3b8",
					textAlign: "center",
					maxWidth: "800px",
				}}
			>
				Instant mock servers • OpenAPI import • Chaos engineering
			</div>
		</div>,
		{ ...size }
	);
}
