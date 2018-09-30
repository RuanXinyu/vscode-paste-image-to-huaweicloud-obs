'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as moment from 'moment';
import * as upath from 'upath';

var fse = require('fs-extra');
var obsSync = require('huaweicloud-obs-sync');

class Logger {
    static channel: vscode.OutputChannel;

    static log(message: any) {
        if (this.channel) {
            let time = moment().format("MM-DD HH:mm:ss");
            this.channel.appendLine(`[${time}] ${message}`);
        }
    }

    static showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        this.log(message);
        return vscode.window.showInformationMessage(message, ...items);
    }

    static showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        this.log(message);
        return vscode.window.showErrorMessage(message, ...items);
    }
}

export function activate(context: vscode.ExtensionContext) {
    Logger.channel = vscode.window.createOutputChannel("PasteImage")
    context.subscriptions.push(Logger.channel);

    Logger.log('Congratulations, your extension "vscode-paste-image" is now active!');

    let disposable = vscode.commands.registerCommand('extension.pasteImageToHuaweiCloudOBS', () => {
        try {
            Paster.paste();
        } catch (e) { 
            Logger.showErrorMessage(e)
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}

class Paster {
    static PATH_VARIABLE_CURRNET_FILE_DIR = /\$\{currentFileDir\}/g;
    static PATH_VARIABLE_PROJECT_ROOT = /\$\{projectRoot\}/g;
    static PATH_VARIABLE_CURRNET_FILE_NAME = /\$\{currentFileName\}/g;
    static PATH_VARIABLE_CURRNET_FILE_NAME_WITHOUT_EXT = /\$\{currentFileNameWithoutExt\}/g;

    static PATH_VARIABLE_IMAGE_FILE_PATH = /\$\{imageFilePath\}/g;
    static PATH_VARIABLE_IMAGE_ORIGINAL_FILE_PATH = /\$\{imageOriginalFilePath\}/g;
    static PATH_VARIABLE_IMAGE_FILE_NAME = /\$\{imageFileName\}/g;
    static PATH_VARIABLE_IMAGE_FILE_NAME_WITHOUT_EXT = /\$\{imageFileNameWithoutExt\}/g;
    static PATH_VARIABLE_IMAGE_SYNTAX_PREFIX = /\$\{imageSyntaxPrefix\}/g;
    static PATH_VARIABLE_IMAGE_SYNTAX_SUFFIX = /\$\{imageSyntaxSuffix\}/g;

    static defaultNameConfig: string;
    static folderPathConfig: string;
    static basePathConfig: string;
    static prefixConfig: string;
    static suffixConfig: string;
    static forceUnixStyleSeparatorConfig: boolean;
    static encodePathConfig: string;
    static namePrefixConfig: string;
    static nameSuffixConfig: string;
    static insertPatternConfig: string;
    static obsEnableConfig: string;
    static obsServerConfig: string;
    static obsBucketConfig: string;
    static obsAccessKeyIdConfig: string;
    static obsSecretAccessKeyConfig: string;
    static obsUploadDirConfig: string;

    public static paste() {
        // get current edit file path
        let editor = vscode.window.activeTextEditor;
        if (!editor) return;

        let fileUri = editor.document.uri;
        if (!fileUri) return;
        if (fileUri.scheme === 'untitled') {
            Logger.showInformationMessage('Before paste image, you need to save current edit file first.');
            return;
        }
        let filePath = fileUri.fsPath;
        let projectPath = vscode.workspace.rootPath || "";

        // get selection as image file name, need check
        var selection = editor.selection;
        var selectText = editor.document.getText(selection);
        if (selectText && /[\\:*?<>|]/.test(selectText)) {
            Logger.showInformationMessage('Your selection is not a valid file name!');
            return;
        }

        // load config pasteImage.defaultName
        this.defaultNameConfig = vscode.workspace.getConfiguration('pasteImage')['defaultName'];
        if (!this.defaultNameConfig) {
            this.defaultNameConfig = "Y-MM-DD-HH-mm-ss"
        }

        // load config pasteImage.path
        this.folderPathConfig = vscode.workspace.getConfiguration('pasteImage')['path'];
        if (!this.folderPathConfig) {
            this.folderPathConfig = "${currentFileDir}";
        }
        if (this.folderPathConfig.length !== this.folderPathConfig.trim().length) {
            Logger.showErrorMessage(`The config pasteImage.path = '${this.folderPathConfig}' is invalid. please check your config.`);
            return;
        }
        // load config pasteImage.basePath
        this.basePathConfig = vscode.workspace.getConfiguration('pasteImage')['basePath'];
        if (!this.basePathConfig) {
            this.basePathConfig = "";
        }
        if (this.basePathConfig.length !== this.basePathConfig.trim().length) {
            Logger.showErrorMessage(`The config pasteImage.path = '${this.basePathConfig}' is invalid. please check your config.`);
            return;
        }
        // load other config
        this.prefixConfig = vscode.workspace.getConfiguration('pasteImage')['prefix'];
        this.suffixConfig = vscode.workspace.getConfiguration('pasteImage')['suffix'];
        this.forceUnixStyleSeparatorConfig = vscode.workspace.getConfiguration('pasteImage')['forceUnixStyleSeparator'];
        this.forceUnixStyleSeparatorConfig = !!this.forceUnixStyleSeparatorConfig;
        this.encodePathConfig = vscode.workspace.getConfiguration('pasteImage')['encodePath'];
        this.namePrefixConfig = vscode.workspace.getConfiguration('pasteImage')['namePrefix'];
        this.nameSuffixConfig = vscode.workspace.getConfiguration('pasteImage')['nameSuffix'];
        this.insertPatternConfig = vscode.workspace.getConfiguration('pasteImage')['insertPattern'];
        this.obsEnableConfig = vscode.workspace.getConfiguration('pasteImage')['obsEnable'];
        this.obsServerConfig = vscode.workspace.getConfiguration('pasteImage')['obsServer'];
        this.obsBucketConfig = vscode.workspace.getConfiguration('pasteImage')['obsBucket'];
        this.obsAccessKeyIdConfig = vscode.workspace.getConfiguration('pasteImage')['obsAccessKeyId'];
        this.obsSecretAccessKeyConfig = vscode.workspace.getConfiguration('pasteImage')['obsSecretAccessKey'];
        this.obsUploadDirConfig = vscode.workspace.getConfiguration('pasteImage')['obsUploadDir'];

        // replace variable in config
        this.defaultNameConfig = this.replacePathVariable(this.defaultNameConfig, projectPath, filePath, (x) => `[${x}]`);
        this.folderPathConfig = this.replacePathVariable(this.folderPathConfig, projectPath, filePath);
        this.basePathConfig = this.replacePathVariable(this.basePathConfig, projectPath, filePath);
        this.namePrefixConfig = this.replacePathVariable(this.namePrefixConfig, projectPath, filePath);
        this.nameSuffixConfig = this.replacePathVariable(this.nameSuffixConfig, projectPath, filePath);
        this.insertPatternConfig = this.replacePathVariable(this.insertPatternConfig, projectPath, filePath);
        this.obsUploadDirConfig = this.replacePathVariable(this.obsUploadDirConfig, projectPath, filePath);

        let imagePath = this.getImagePath(filePath, selectText, this.folderPathConfig);

        try {
            // is the file existed?
            let existed = fs.existsSync(imagePath);
            if (existed) {
                Logger.showInformationMessage(`File ${imagePath} existed.Would you want to replace?`, 'Replace', 'Cancel').then(choose => {
                    if (choose != 'Replace') return;

                    if (!editor) return;
                    this.saveAndPaste(editor, imagePath);
                });
            } else {
                this.saveAndPaste(editor, imagePath);
            }
        } catch (err) {
            Logger.showErrorMessage(`fs.existsSync(${imagePath}) fail. message=${err.message}`);
            return;
        }
    }

    public static saveAndPaste(editor: vscode.TextEditor, imagePath: string) {
        this.createImageDirWithImagePath(imagePath).then(imagePath => {
            // save image and insert to current edit file
            this.saveClipboardImageToFileAndGetPath(imagePath.toString(), (imagePath: string, imagePathReturnByScript: string) => {
                if (!imagePathReturnByScript) return;
                if (imagePathReturnByScript === 'no image') {
                    Logger.showInformationMessage('There is not a image in clipboard.');
                    return;
                }

                imagePath = this.renderFilePath(this.insertPatternConfig, editor.document.languageId, this.basePathConfig, imagePath, this.forceUnixStyleSeparatorConfig, this.prefixConfig, this.suffixConfig);

                editor.edit(edit => {
                    let current = editor.selection;

                    if (current.isEmpty) {
                        edit.insert(current.start, imagePath);
                    } else {
                        edit.replace(current, imagePath);
                    }
                });
            }, (imagePath) => {
                if (this.obsEnableConfig != "yes") {
                    return;
                }

                Logger.showInformationMessage("uploading file to huaweicloud obs ...");
                this.obsUploadDirConfig = this.obsUploadDirConfig.replace(/(^\/*)|(\/*$)/g, "").replace(/(^\s*)|(\s*$)/g, "")
                this.obsUploadDirConfig = this.renderFilePath(this.obsUploadDirConfig, editor.document.languageId, this.basePathConfig, imagePath, this.forceUnixStyleSeparatorConfig, this.prefixConfig, this.suffixConfig);
                obsSync.syncFileToOBS({
                    server : this.obsServerConfig,
                    bucket: this.obsBucketConfig,
                    accessKeyId: this.obsAccessKeyIdConfig,
                    secretAccessKey: this.obsSecretAccessKeyConfig,
                    localFileName: imagePath,
                    remoteFileName: this.obsUploadDirConfig
                }).then(() => {
                    Logger.showInformationMessage("uploading file to huaweicloud obs success");
                    vscode.window.showInformationMessage('upload to huaweicloud obs success');
                });
            });
        }).catch(err => {
            if (err instanceof PluginError) {
                Logger.showErrorMessage(err.message || "");
            } else {
                Logger.showErrorMessage(`Failed make folder. message=${err.message}`);
            }
            return;
        });
    }

    public static getImagePath(filePath: string, selectText: string, folderPathFromConfig: string): string {
        // image file name
        let imageFileName = "";
        if (!selectText) {
            imageFileName = this.namePrefixConfig + moment().format(this.defaultNameConfig) + this.nameSuffixConfig + ".png";
        } else {
            imageFileName = this.namePrefixConfig + selectText + this.nameSuffixConfig + ".png";
        }

        // image output path
        let folderPath = path.dirname(filePath);
        let imagePath = "";

        // generate image path
        if (path.isAbsolute(folderPathFromConfig)) {
            imagePath = path.join(folderPathFromConfig, imageFileName);
        } else {
            imagePath = path.join(folderPath, folderPathFromConfig, imageFileName);
        }

        return imagePath;
    }

    /**
     * create directory for image when directory does not exist
     */
    private static createImageDirWithImagePath(imagePath: string) {
        return new Promise((resolve, reject) => {
            let imageDir = path.dirname(imagePath);

            fs.stat(imageDir, (err, stats) => {
                if (err == null) {
                    if (stats.isDirectory()) {
                        resolve(imagePath);
                    } else {
                        reject(new PluginError(`The image dest directory '${imageDir}' is a file. please check your 'pasteImage.path' config.`))
                    }
                } else if (err.code == "ENOENT") {
                    fse.ensureDir(imageDir, (err: NodeJS.ErrnoException) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(imagePath);
                    });
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * use applescript to save image from clipboard and get file path
     */
    private static saveClipboardImageToFileAndGetPath(imagePath: string, 
        cbOn: (imagePath: string, imagePathFromScript: string) => void, 
        cbExit: (imagePath: string) => void) {
        if (!imagePath) return;

        let platform = process.platform;
        if (platform === 'win32') {
            // Windows
            const scriptPath = path.join(__dirname, '../res/pc.ps1');

            let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
            let powershellExisted = fs.existsSync(command)
            if (!powershellExisted) {
                command = "powershell"
            }

            const powershell = spawn(command, [
                '-noprofile',
                '-noninteractive',
                '-nologo',
                '-sta',
                '-executionpolicy', 'unrestricted',
                '-windowstyle', 'hidden',
                '-file', scriptPath,
                imagePath
            ]);
            powershell.on('error', function (e: NodeJS.ErrnoException) {
                if (e.code == "ENOENT") {
                    Logger.showErrorMessage(`The powershell command is not in you PATH environment variables.Please add it and retry.`);
                } else {
                    Logger.showErrorMessage(e.message);
                } 
            });
            powershell.on('exit', function (code, signal) {
                // console.log('exit',code,signal);
                cbExit(imagePath);
            });
            powershell.stdout.on('data', function (data: Buffer) {
                cbOn(imagePath, data.toString().trim());
            });
        }
        else if (platform === 'darwin') {
            // Mac
            let scriptPath = path.join(__dirname, '../../res/mac.applescript');

            let ascript = spawn('osascript', [scriptPath, imagePath]);
            ascript.on('error', function (e) {
                Logger.showErrorMessage(e.message);
            });
            ascript.on('exit', function (code, signal) {
                // console.log('exit',code,signal);
                cbExit(imagePath);
            });
            ascript.stdout.on('data', function (data: Buffer) {
                cbOn(imagePath, data.toString().trim());
            });
        } else {
            // Linux 

            let scriptPath = path.join(__dirname, '../../res/linux.sh');

            let ascript = spawn('sh', [scriptPath, imagePath]);
            ascript.on('error', function (e) {
                Logger.showErrorMessage(e.message);
            });
            ascript.on('exit', function (code, signal) {
                // console.log('exit',code,signal);
                cbExit(imagePath);
            });
            ascript.stdout.on('data', function (data: Buffer) {
                let result = data.toString().trim();
                if (result == "no xclip") {
                    Logger.showInformationMessage('You need to install xclip command first.');
                    return;
                }
                cbOn(imagePath, result);
            });
        }
    }

    /**
     * render the image file path dependen on file type
     * e.g. in markdown image file path will render to ![](path)
     */
    public static renderFilePath(formatStr: string, languageId: string, basePath: string, imageFilePath: string, forceUnixStyleSeparator: boolean, prefix: string, suffix: string): string {
        if (basePath) {
            imageFilePath = path.relative(basePath, imageFilePath);
        }

        if (forceUnixStyleSeparator) {
            imageFilePath = upath.normalize(imageFilePath);
        }

        let originalImagePath = imageFilePath;
        let ext = path.extname(originalImagePath);
        let fileName = path.basename(originalImagePath);
        let fileNameWithoutExt = path.basename(originalImagePath, ext);

        imageFilePath = `${prefix}${imageFilePath}${suffix}`;

        if (this.encodePathConfig == "urlEncode") {
            imageFilePath = encodeURI(imageFilePath)
        } else if (this.encodePathConfig == "urlEncodeSpace") {
            imageFilePath = imageFilePath.replace(/ /g, "%20");
        }

        let imageSyntaxPrefix = "";
        let imageSyntaxSuffix = ""
        switch (languageId) {
            case "markdown":
                imageSyntaxPrefix = `![](`
                imageSyntaxSuffix = `)`
                break;
            case "asciidoc":
                imageSyntaxPrefix = `image::`
                imageSyntaxSuffix = `[]`
                break;
        }

        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_SYNTAX_PREFIX, imageSyntaxPrefix);
        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_SYNTAX_SUFFIX, imageSyntaxSuffix);

        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_FILE_PATH, imageFilePath);
        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_ORIGINAL_FILE_PATH, originalImagePath);
        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_FILE_NAME, fileName);
        formatStr = formatStr.replace(this.PATH_VARIABLE_IMAGE_FILE_NAME_WITHOUT_EXT, fileNameWithoutExt);

        return formatStr;
    }

    public static replacePathVariable(pathStr: string, projectRoot: string, curFilePath: string, postFunction: (string: string) => string = (x) => x): string {
        let currentFileDir = path.dirname(curFilePath);
        let ext = path.extname(curFilePath);
        let fileName = path.basename(curFilePath);
        let fileNameWithoutExt = path.basename(curFilePath, ext);

        pathStr = pathStr.replace(this.PATH_VARIABLE_PROJECT_ROOT, postFunction(projectRoot));
        pathStr = pathStr.replace(this.PATH_VARIABLE_CURRNET_FILE_DIR, postFunction(currentFileDir));
        pathStr = pathStr.replace(this.PATH_VARIABLE_CURRNET_FILE_NAME, postFunction(fileName));
        pathStr = pathStr.replace(this.PATH_VARIABLE_CURRNET_FILE_NAME_WITHOUT_EXT, postFunction(fileNameWithoutExt));
        return pathStr;
    }
}

class PluginError {
    constructor(public message?: string) {
    }
}