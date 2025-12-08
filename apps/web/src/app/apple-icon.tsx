import { ImageResponse } from "next/og";

export const size = {
	width: 180,
	height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(145deg, #0a0a0c 0%, #0f0f14 100%)",
				borderRadius: "40px",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Ambient glow */}
			<div
				style={{
					position: "absolute",
					top: "-30%",
					left: "-30%",
					width: "160%",
					height: "160%",
					background: "radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "-30%",
					right: "-30%",
					width: "120%",
					height: "120%",
					background: "radial-gradient(circle at 65% 65%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
				}}
			/>

			{/* Logo mark */}
			<div
				style={{
					width: "120px",
					height: "120px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
				}}
			>
				{/* Violet layer */}
				<div
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
						borderRadius: "28px",
						transform: "rotate(12deg)",
						opacity: 0.9,
						boxShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
					}}
				/>
				{/* Blue layer */}
				<div
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
						borderRadius: "28px",
						transform: "rotate(-12deg)",
						opacity: 0.7,
						boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)",
					}}
				/>
				{/* Center */}
				<div
					style={{
						width: "96px",
						height: "96px",
						background: "linear-gradient(145deg, #0a0a0c 0%, #12121a 100%)",
						borderRadius: "22px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1,
						border: "1px solid rgba(255, 255, 255, 0.06)",
					}}
				>
					<svg
						width="52"
						height="52"
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
		</div>,
		{ ...size }
	);
}
