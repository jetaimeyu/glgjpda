/**
 * Created by xq on 17/9/20.
 */

'use strict';

const webpack = require("webpack");
const path = require("path");
const glob = require("glob");
const fs = require("fs");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = function (env) {
    //环境变量
    env && env.dev && (env.dev = (env.dev === 'true'));
    env && env.minimize && (env.minimize = (env.minimize === 'true'));
    env = Object.assign(
        fs.existsSync("./webpack.config.json") ? JSON.parse(fs.readFileSync("./webpack.config.json", "utf-8")) : {},
        env
    );
    env = Object.assign({
            "dev": true,
            "minimize": false
        },
        env
    );

    console.log('Config：' + JSON.stringify(env));
    let css_extract = new ExtractTextPlugin({
        filename: `[name]-[chunkhash].css`,
        allChunks: true
    });

    let entry = {}, plugins = [];
    plugins.push(css_extract);
    if (env.minimize) {
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            comments: false,
            minimize: true
        }));
    }

    let pages = glob.sync(path.join(__dirname, './src/pages/**/*.html'))
        .concat(glob.sync(path.join(__dirname, './src/*.html')))
        .map(_page => path.relative(__dirname, _page));
    pages.forEach(_page => {
        let js = "./" + _page.replace(/\.html$/ig, ".js");
        let options = {
            inject: "body",
            filename: _page.replace(/^(.\/)?src\//ig, ""),
            template: _page,
            chunks: ["resource/common"]
        };
        if (fs.existsSync(js)) {
            let _entry = js.replace(/^(.\/)?src\//ig, "").replace(/\.js/ig, "");
            entry[_entry] = js;
            options.chunks.push(_entry);
        }
        plugins.push(new HtmlWebpackPlugin(options));
    });

    entry["resource/common"] = `./src/js/global.js`;
    return {
        entry: entry,
        output: {
            path: path.join(__dirname, "dist"),
            filename: "[name]-[chunkhash].js",
            chunkFilename: "[name]-[chunkhash].js"
        },
        watch: env.dev,
        externals: {},
        resolve: {
            extensions: ['.js', '.css', '.sass']
        },
        module: {
            rules: [{
                test: /\.html$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'html-loader',
                    options: {
                        minimize: env.minimize
                    }
                }]
            },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015']
                    }
                },
                {
                    test: /\.css$/,
                    loader: css_extract.extract({
                        use: [{
                            loader: 'css-loader',
                            options: {
                                minimize: env.minimize
                            }
                        }]
                    })
                },
                {
                    test: /\.scss$/,
                    exclude: /node_modules/,
                    loader: css_extract.extract({
                        use: [{
                            loader: 'css-loader',
                            options: {
                                minimize: env.minimize
                            }
                        }, 'sass-loader']
                    })
                },
                {
                    test: /\.(gif|png|jpg|svg)$/,
                    loader: 'url-loader?limit=8192&name=resource/images/[hash].[ext]'
                },
                {
                    test: /\.(eot|woff|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader?limit=1000&name=resource/fonts/[hash].[ext]'
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader?limit=1000&name=resource/fonts/[hash].[ext]&mimetype=application/octet-stream'
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                __DEV__: true
            }),
            new webpack.NamedModulesPlugin(),
            new webpack.NoEmitOnErrorsPlugin(),
            new CopyWebpackPlugin([{
                from: 'src/manifest.json',
                to: ''
            }]),
            function () {
                this.plugin("done", function () {
                    pages.forEach(_page => {
                        _page = _page.replace(/^(\.\/)?src\//, "$1dist/");
                        let content = fs.readFileSync(path.join(__dirname, _page), "utf-8");
                        content = content.replace(/\s*<(link|script)[^>]+(href|src)\s*=\s*['"]([^'"]+)['"][^>]*>(\s*<\/script>)?/ig, function ($0, $1, $2, $3) {
                            if (fs.existsSync(path.join(path.dirname(path.join(__dirname, _page)), $3))) {
                                return $0;
                            }
                            return "";
                        });
                        fs.writeFileSync(path.join(__dirname, _page), content);
                    });
                });
            }
        ].concat(plugins)
    };
};