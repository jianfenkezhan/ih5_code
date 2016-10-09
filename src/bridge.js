var bridge = window['VxBridge'];
module.exports = {
'create':bridge.create,
'setFilePath':bridge.setFilePath,
'getRenderer':bridge.getRenderer,
'getRendererType':bridge.getRendererType,
'getDomElement':bridge.getDomElement,
'resetClass':bridge.resetClass,
'addClass':bridge.addClass,
'addWidget':bridge.addWidget,
'removeWidget':bridge.removeWidget,
'setLinks':bridge.setLinks,
'render':bridge.render,
'createGraphics':bridge.createGraphics,
'encryptData':bridge.encryptData,
'decryptData':bridge.decryptData,
'selectWidget':bridge.selectWidget,
'reorderWidget':bridge.reorderWidget,
'updateSelector':bridge.updateSelector,
'addMouseDownHandler':bridge.addMouseDownHandler,
'isDom':bridge.isDom,
'setGenerateText':bridge.setGenerateText,
'isTimer':bridge.isTimer,
'timerAddCallback':bridge.timerAddCallback,
'timerRemoveCallback':bridge.timerRemoveCallback,
};
