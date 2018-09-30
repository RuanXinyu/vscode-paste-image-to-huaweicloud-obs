# Paste Image To HuaweiCloud OBS

Paste image directly from clipboard to markdown/asciidoc(or other file) and then upload file to huaweicloud obs! 

> **注意**：该插件是在`Paste Image`插件上修改，增加上传到华为云OBS的功能，完全兼容`Paste Image`的参数和快捷方式，说明文档也是在其基础上进行添加。

**Support Mac/Windows/Linux!** And support config destination folder.

## Usage

1. capture screen to clipboard
2. Open the command palette: `Ctrl+Shift+P` (`Cmd+Shift+P` on Mac)
3. Type: "Paste Image" or you can use default keyboard binding: `Ctrl+Alt+V` (`Cmd+Alt+V` on Mac).
4. Image will be saved in the folder that contains current editing file
5. The relative path will be paste to current editing file 

## Config

- `pasteImage.defaultName`

    The default image file name.

    The value of this config will be pass to the 'format' function of moment library(a js time manipulation library), you can read document https://momentjs.com/docs/#/displaying/format/ for advanced usage.

    And you can use variable:

    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.

    Default value is `Y-MM-DD-HH-mm-ss`.

- `pasteImage.path`

    The destination to save image file.
    
    You can use variable:
    
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.

    Default value is `${currentFileDir}`.

- `pasteImage.basePath`

    The base path of image url.
    
    You can use variable:
    
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.

    Default value is `${currentFileDir}`.

- `pasteImage.forceUnixStyleSeparator`

    Force set the file separator styel to unix style. If set false, separator styel will follow the system style. 
    
    Default is `true`.

- `pasteImage.prefix`

    The string prepend to the resolved image path before paste.

    Default is `""`.

- `pasteImage.suffix`

    The string append to the resolved image path before paste.

    Default is `""`.

- `pasteImage.encodePath`

    How to encode image path before insert to editor. Support options:

    - `none`: do nothing, just insert image path to text
    - `urlEncode`: url encode whole image path
    - `urlEncodeSpace`: url encode only space character(sapce to %20)

    Defalut is `urlEncodeSpace`.

- `pasteImage.namePrefix`

    The string prepend to the image file name.

    You can use variable:
    
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.

    Default is `""`.

- `pasteImage.nameSuffix`

    The string append to the image name.

    You can use variable:
    
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.

    Default is `""`.

- `pasteImage.insertPattren`

    The pattern of string that would be pasted to text. 

    You can use variable:

    - `${imageFilePath}`: the image file path, with `pasteImage.prefix`, `pasteImage.suffix`, and url encoded.
    - `${imageOriginalFilePath}`: the image file path.
    - `${imageFileName}`:  the image file name with ext.
    - `${imageFileNameWithoutExt}`: the image file name without ext.
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.
    - `${imageSyntaxPrefix}`: in markdown file it would be <code>![](</code>, in asciidoc file it would be <code>image::</code>, in other file it would be empty string
    - `${imageSyntaxSuffix}`: in markdown file it would be <code>)</code>, in asciidoc file it would be <code>[]</code>, in other file it would be empty string

    Defalut is `${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}`.

- `pasteImage.obsEnable`

    Enable the function of uploadinf file to huaweicloud obs.

    Default is `"yes"`.
    
- `pasteImage.obsServer`

    The server of huaweicloud obs.

    Default is `"https://obs.cn-north-1.myhwclouds.com"`.
    
- `pasteImage.obsBucket`

    The bucket of huaweicloud obs, e.g. `obs-2f97`.

    Default is `""`.
    
- `pasteImage.obsAccessKeyId`

    The access key id of huaweicloud obs, e.g. `R7DYQD3DQRRLTDWYttE3S`.

    Default is `""`.
    
- `pasteImage.obsSecretAccessKey`

    The secret access key id of huaweicloud obs, e.g. `TERHf0NGpDrbhsbc1h3xymB9w22wK8lLgOhdgFkgjCB2`.

    Default is `""`.

- `pasteImage.obsUploadDir`

    The directory of huaweicloud obs to upload. 

    You can use variable:

    - `${imageFilePath}`: the image file path, with `pasteImage.prefix`, `pasteImage.suffix`, and url encoded.
    - `${imageOriginalFilePath}`: the image file path.
    - `${imageFileName}`:  the image file name with ext.
    - `${imageFileNameWithoutExt}`: the image file name without ext.
    - `${currentFileDir}`: the path of directory that contain current editing file. 
    - `${projectRoot}`: the path of the project opened in vscode.
    - `${currentFileName}`: the current file name with ext.
    - `${currentFileNameWithoutExt}`: the current file name without ext.
    - `${imageSyntaxPrefix}`: in markdown file it would be <code>![](</code>, in asciidoc file it would be <code>image::</code>, in other file it would be empty string
    - `${imageSyntaxSuffix}`: in markdown file it would be <code>)</code>, in asciidoc file it would be <code>[]</code>, in other file it would be empty string

    Defalut is `${currentFileNameWithoutExt}/${imageFileName}`.

## Config Example

I use vscode to edit my hexo blog. The folder struct like this:

```
blog/source/_posts  (articles)
blog/source/img     (images)
```

I want to save all image in `blog/source/img`, and insert image url to article. And hexo will generate `blog/source/` as the website root, so the image url shoud be like `/img/xxx.png`. So I can config pasteImage in `blog/.vscode/setting.json` like this:

```
"pasteImage.path": "${projectRoot}/source/img",
"pasteImage.basePath": "${projectRoot}/source",
"pasteImage.forceUnixStyleSeparator": true,
"pasteImage.prefix": "/"

"pasteImage.obsEnable": "yes",
"pasteImage.obsServer": "https://obs.cn-north-1.myhwclouds.com",
"pasteImage.obsBucket": "obs-2f97",
"pasteImage.obsAccessKeyId": "R7DYQD3DQRRLTDWYttE3S",
"pasteImage.obsSecretAccessKey": "TERHf0NGpDrbhsbc1h3xymB9w22wK8lLgOhdgFkgjCB2",
"pasteImage.obsUploadDir": "Blog/images/${currentFileNameWithoutExt}/${imageFileName}",
```

If you want to save image in separate directory:

```
"pasteImage.path": "${projectRoot}/source/img/${currentFileNameWithoutExt}",
"pasteImage.basePath": "${projectRoot}/source",
"pasteImage.forceUnixStyleSeparator": true,
"pasteImage.prefix": "/"
```

If you want to save image with article name as prefix:

```
"pasteImage.namePrefix": "${currentFileNameWithoutExt}_",
"pasteImage.path": "${projectRoot}/source/img",
"pasteImage.basePath": "${projectRoot}/source",
"pasteImage.forceUnixStyleSeparator": true,
"pasteImage.prefix": "/"
```

If you want to use html in markdown:

```
"pasteImage.insertPattern": "<img>${imageFileName}</img>"
"pasteImage.path": "${projectRoot}/source/img",
"pasteImage.basePath": "${projectRoot}/source",
"pasteImage.forceUnixStyleSeparator": true,
"pasteImage.prefix": "/"
```

## Format

### File name format

If you selected some text in editor, then extension will use it as the image file name. **The selected text can be a sub path like `subFolder/subFolder2/nameYouWant`.**

If not the image will be saved in this format: "Y-MM-DD-HH-mm-ss.png". You can config default image file name by `pasteImage.defaultName`.

### File link format

When you editing a markdown, it will pasted as markdown image link format `![](imagePath)`.

When you editing a asciidoc, it will pasted as asciidoc image link format `image::imagePath[]`.

In other file, it just paste the image's path.

Now you can use configuration `pasteImage.insertPattern` to config the fomat of file link.

## Contact

If you have some any question or advice, Welcome to [issue](https://github.com/RuanXinyu/vscode-paste-image-to-huaweicloud-obs/issues)

## License

The extension and source are licensed under the [MIT license](LICENSE.txt).
