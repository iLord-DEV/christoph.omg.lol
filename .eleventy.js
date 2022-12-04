const EleventyVitePlugin = require('@11ty/eleventy-plugin-vite')
const Image = require('@11ty/eleventy-img')
const EleventyPluginNavigation = require('@11ty/eleventy-navigation')
const EleventyPluginRss = require('@11ty/eleventy-plugin-rss')

const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')

const path = require('path')

// IMAGE SHORTCODE
async function imageShortcode(src, alt, sizes) {
  const options = {
    useCache: true, // set to false while you are playing with the img quality
    widths: [300, 600, 1200],
    formats: ['avif', 'webp', 'jpg'],
    outputDir: 'dist/img',
    sharpWebpOptions: {
    	quality: 85,
    	smartSubsample: true,
    	effort: 6
    },
    sharpJpegOptions: {
    	quality: 85
    },
    sharpAvifOptions: {
    	quality: 85
    },

    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src)
      const name = path.basename(src, extension)

      return `${name}-${width}w.${format}`
    }
  }

  const metadata = await Image(src, options)

  let imageAttributes = {
    alt,
    sizes,
    loading: 'lazy',
    decoding: 'async'
  }

  return Image.generateHTML(metadata, imageAttributes, {
    whitespaceMode: 'inline'
  })
}

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(EleventyPluginNavigation)
  eleventyConfig.addPlugin(EleventyPluginRss)
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      clearScreen: false,

      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `$injectedColor: orange;`,
            devSourcemap: true
          }
        }
      },

      server: {
        mode: 'development',
        middlewareMode: true
      },
      appType: 'custom',
      build: {
        mode: 'production',
        rollupOptions: {
          output: {
            chunkFileNames: 'js/[name]-[hash].js',
            entryFileNames: 'js/[name]-[hash].js',

            assetFileNames: ({ name }) => {
              if (/\.(avif|webp|gif|jpe?g|png|svg)$/.test(name ?? '')) {
                return 'img/[name]-[hash][extname]'
              }

              if (/\.(woff|woff2|otf)$/.test(name ?? '')) {
                return 'fonts/[name]-[hash][extname]'
              }

              if (/\.css$/.test(name ?? '')) {
                return 'css/[name]-[hash][extname]'
              }

              // default value
              // ref: https://rollupjs.org/guide/en/#outputassetfilenames
              return '[name]-[hash][extname]'
            }
          }
        }
      }
    }
  })

  eleventyConfig.setServerOptions({
    showAllHosts:true,
  }),

  // eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy('src/css')
  eleventyConfig.addPassthroughCopy('src/js')
  eleventyConfig.addPassthroughCopy('src/img')
  eleventyConfig.addPassthroughCopy('src/public')
  eleventyConfig.setServerPassthroughCopyBehavior('copy')

  // image shortcodes
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode)
  eleventyConfig.addLiquidShortcode('image', imageShortcode)
  eleventyConfig.addJavaScriptFunction('image', imageShortcode)

  // Filters
  Object.keys(filters).forEach((filterName) => {
    eleventyConfig.addFilter(filterName, filters[filterName])
  })

  // Transforms
  Object.keys(transforms).forEach((transformName) => {
    eleventyConfig.addTransform(transformName, transforms[transformName])
  })
  // Shortcodes
  Object.keys(shortcodes).forEach((shortcodeName) => {
    eleventyConfig.addShortcode(shortcodeName, shortcodes[shortcodeName])
  })

eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`)

// Layouts
eleventyConfig.addLayoutAlias('base', 'layouts/base.njk')
eleventyConfig.addLayoutAlias('post', 'layouts/post.njk')



  return {
    templateFormats: ['md', 'njk'],
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',

    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      // layouts: 'layouts',
      data: '_data'

    }
  }
}
