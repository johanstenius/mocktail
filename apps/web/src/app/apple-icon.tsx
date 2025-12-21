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
					background:
						"radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
				}}
			/>

			{/* Logo mark */}
			<div
				style={{
					width: "100px",
					height: "100px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
				}}
			>
				{/* Outer glow */}
				<div
					style={{
						position: "absolute",
						width: "130%",
						height: "130%",
						background:
							"radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
						borderRadius: "50%",
					}}
				/>
				{/* Violet layer */}
				<div
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
						borderRadius: "24px",
						transform: "rotate(15deg)",
						boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)",
					}}
				/>
				{/* Blue layer */}
				<div
					style={{
						position: "absolute",
						width: "85%",
						height: "85%",
						background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
						borderRadius: "18px",
						transform: "rotate(-10deg)",
						boxShadow: "0 0 25px rgba(59, 130, 246, 0.3)",
					}}
				/>
				{/* Inner accent */}
				<div
					style={{
						width: "50%",
						height: "50%",
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
						borderRadius: "10px",
						transform: "rotate(5deg)",
						zIndex: 1,
					}}
				/>
			</div>
		</div>,
		{ ...size },
	);
}
