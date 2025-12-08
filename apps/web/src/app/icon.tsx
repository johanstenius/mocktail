import { ImageResponse } from "next/og";

export const size = {
	width: 32,
	height: 32,
};
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0a0a0a",
				borderRadius: "6px",
			}}
		>
			<div
				style={{
					width: "24px",
					height: "24px",
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
						borderRadius: "4px",
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
						borderRadius: "4px",
						transform: "rotate(-12deg)",
						opacity: 0.6,
					}}
				/>
				<div
					style={{
						width: "20px",
						height: "20px",
						background: "#0a0a0a",
						borderRadius: "3px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1,
					}}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="white"
						strokeWidth="3"
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
