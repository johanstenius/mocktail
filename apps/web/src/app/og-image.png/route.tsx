import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
			{/* Subtle grid pattern */}
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
					background:
						"radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)",
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
					background:
						"radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)",
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
					background:
						"radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 60%)",
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
					background:
						"linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2) 20%, rgba(139, 92, 246, 0.2) 80%, transparent)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "80px",
					left: "80px",
					right: "80px",
					height: "1px",
					background:
						"linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15) 20%, rgba(59, 130, 246, 0.15) 80%, transparent)",
				}}
			/>

			{/* Corner markers */}
			<div
				style={{
					position: "absolute",
					top: "60px",
					left: "60px",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						width: "24px",
						height: "1px",
						background: "rgba(139, 92, 246, 0.4)",
					}}
				/>
				<div
					style={{
						width: "1px",
						height: "24px",
						background: "rgba(139, 92, 246, 0.4)",
					}}
				/>
			</div>
			<div
				style={{
					position: "absolute",
					top: "60px",
					right: "60px",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
				}}
			>
				<div
					style={{
						width: "24px",
						height: "1px",
						background: "rgba(139, 92, 246, 0.4)",
					}}
				/>
				<div
					style={{
						width: "1px",
						height: "24px",
						background: "rgba(139, 92, 246, 0.4)",
						alignSelf: "flex-end",
					}}
				/>
			</div>
			<div
				style={{
					position: "absolute",
					bottom: "60px",
					left: "60px",
					display: "flex",
					flexDirection: "column-reverse",
				}}
			>
				<div
					style={{
						width: "24px",
						height: "1px",
						background: "rgba(59, 130, 246, 0.3)",
					}}
				/>
				<div
					style={{
						width: "1px",
						height: "24px",
						background: "rgba(59, 130, 246, 0.3)",
					}}
				/>
			</div>
			<div
				style={{
					position: "absolute",
					bottom: "60px",
					right: "60px",
					display: "flex",
					flexDirection: "column-reverse",
					alignItems: "flex-end",
				}}
			>
				<div
					style={{
						width: "24px",
						height: "1px",
						background: "rgba(59, 130, 246, 0.3)",
					}}
				/>
				<div
					style={{
						width: "1px",
						height: "24px",
						background: "rgba(59, 130, 246, 0.3)",
						alignSelf: "flex-end",
					}}
				/>
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
						width: "80px",
						height: "80px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
						marginBottom: "32px",
					}}
				>
					<div
						style={{
							position: "absolute",
							width: "120%",
							height: "120%",
							background:
								"radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
							borderRadius: "50%",
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
							borderRadius: "18px",
							transform: "rotate(15deg)",
							boxShadow: "0 0 50px rgba(139, 92, 246, 0.5)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "85%",
							height: "85%",
							background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
							borderRadius: "14px",
							transform: "rotate(-10deg)",
							boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)",
						}}
					/>
					<div
						style={{
							width: "50%",
							height: "50%",
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
							borderRadius: "8px",
							transform: "rotate(5deg)",
							zIndex: 1,
						}}
					/>
				</div>

				{/* Product name */}
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

				{/* Tagline */}
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

				{/* Feature pills */}
				<div
					style={{
						display: "flex",
						gap: "24px",
						marginTop: "48px",
					}}
				>
					{["OpenAPI Import", "Chaos Engineering", "Team Collaboration"].map(
						(feature) => (
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
						)
					)}
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
		{ width: 1200, height: 630 }
	);
}
