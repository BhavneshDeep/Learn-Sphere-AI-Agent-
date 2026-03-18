/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle .node files - treat them as assets (webpack 5 built-in)
    config.module.rules.push({
      test: /\.node$/,
      type: 'asset/resource',
    })
    
    // Use webpack's IgnorePlugin to ignore .node binary files from onnxruntime-node
    // This prevents webpack from trying to parse binary files
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore .node files from onnxruntime-node
          if (/\.node$/.test(resource) && context.includes('onnxruntime-node')) {
            return true
          }
          return false
        },
      })
    )
    
    // Mark onnxruntime-node as external for server-side builds
    // This prevents webpack from trying to bundle the native module
    if (isServer) {
      const originalExternals = config.externals
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        'onnxruntime-node',
        // FIX: Add sharp and transformers here so Webpack doesn't bundle them by karan
        {
          "sharp": "commonjs sharp",
          "@xenova/transformers": "commonjs @xenova/transformers"
        }
        //
      ]
    }
    
    return config
  },
}

export default nextConfig
