import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "commons.wikimedia.org",
			},
			{
				protocol: "https",
				hostname: "upload.wikimedia.org",
			},
		],
	},
	turbopack: {
		root: projectRoot,
	},
};

export default nextConfig;
