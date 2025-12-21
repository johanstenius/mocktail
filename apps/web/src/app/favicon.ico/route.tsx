import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
	const imageResponse = new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#050507",
				borderRadius: "6px",
				position: "relative",
				overflow: "hidden",
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
						background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
						borderRadius: "5px",
						transform: "rotate(15deg)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						width: "85%",
						height: "85%",
						background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
						borderRadius: "4px",
						transform: "rotate(-10deg)",
					}}
				/>
				<div
					style={{
						width: "50%",
						height: "50%",
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
						borderRadius: "2px",
						transform: "rotate(5deg)",
						zIndex: 1,
					}}
				/>
			</div>
		</div>,
		{ width: 32, height: 32 },
	);

	const arrayBuffer = await imageResponse.arrayBuffer();

	return new Response(arrayBuffer, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
