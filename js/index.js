//require( 'babel-polyfill' )

let Gibber = require( './gibber.js' ),
    useAudioContext = false,
    count = 0

// 收集必要的DOM元素
var domElements = {
  sidebar: document.querySelector('#sidebar'),
  editor: document.querySelector('#editor'),
  console: document.querySelector('#console'),
  splitBar: document.querySelector('#splitBar'),
  tabs: document.querySelector('#tabs'),
  demoTabs: document.querySelector('#demoTabs'),
  schemaTabs: document.querySelector('#schemaTabs'),
  lomView: document.querySelector('#lomView'),
  momView: document.querySelector('#momView'),
  maxSyncRadio: document.querySelector('#maxSyncRadio'),
  liveSyncRadio: document.querySelector('#liveSyncRadio'),
  maxDemosView: document.querySelector('#maxDemosView'),
  liveDemosView: document.querySelector('#liveDemosView'),
  consoleList: document.querySelector('#console_list')
};

// 初始化Gibber，注入DOM元素
Gibber.init(true, domElements)
window.Gibberwocky = window.Gibber = Gibber

