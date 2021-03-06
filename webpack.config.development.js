import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import { spawn } from 'child_process';
import baseConfig from './webpack.config.base';
import HtmlWebpackPlugin from 'html-webpack-plugin';
const port = process.env.PORT || 3000;
const publicPath = `http://localhost:${port}/dist`;

export default merge(baseConfig, {
    devtool: 'eval-source-map',
    mode: 'development',
    entry: [
        'react-hot-loader/patch',
        `webpack-dev-server/client?https://localhost:${port}/`,
        'webpack/hot/only-dev-server',
        path.join(__dirname, process.env.DARK_THEME ? 'main/index-dark.js' : 'main/index.js'),
    ],

    output: {
        publicPath: `https://localhost:${port}/dist/`,
        sourceMapFilename: './bundle.js.map',
        path: path.resolve(__dirname, 'dist'),
        pathinfo: true,
        filename: "[name].bundle.js",
        chunkFilename: "[name].[hash].[id].js"
    },

    module: {
        rules: [
            {
                test: /\.global\.css$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    }
                ]
            },
            {
                test: /^((?!\.global).)*\.css$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                ]
            },
            {
                test: /^((?!\.global).)*\.scss$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                    { loader: 'sass-loader', options: { sourceMap: true } }
                ]
            },
            {
                test: /^((?!\.global).)*\.less$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                    { loader: 'less-loader', options: { sourceMap: true, javascriptEnabled: true, noIeCompat: true } }
                ]
            },
            {
                test: /\.woff(\?[a-z0-9-=]+)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]'
                    }
                },
            },
            {
                test: /\.woff2(\?[a-z0-9-=]+)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]'
                    }
                }
            },
            {
                test: /\.ttf(\?[a-z0-9-=]+)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]'
                    }
                }
            },
            {
                test: /\.eot(\?[a-z0-9-=]+)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]'
                    }
                }
            },
            {
                test: /\.svg(\?[a-z0-9-=]+)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]'
                    }
                }
            },
            {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/images/[name].[ext]'
                    }
                }
            }
        ]
    },

    plugins: [
        // https://webpack.js.org/concepts/hot-module-replacement/
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            'process.env.DARK_THEME': JSON.stringify(process.env.DARK_THEME),
            'process.env.AKASHA_VERSION': JSON.stringify('beta#0')
        }),
        // turn debug mode on.
        new webpack.LoaderOptionsPlugin({
            debug: true
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './app/hot-dev-app.html'
        })
    ],

    target: 'web',
    devServer: {
        port,
        hot: true,
        inline: false,
        historyApiFallback: true,
        contentBase: path.join(__dirname, 'dist'),
        https: true,
        publicPath,
        before () {
            if (process.env.START_HOT) {
                spawn('npm', ['run', 'start-hot'], { shell: true, env: process.env, stdio: 'inherit' })
                    .on('close', code => process.exit(code))
                    .on('error', spawnError => console.error(spawnError));
            }
        }
    },
});
