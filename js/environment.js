// singleton 
let Gibber = null,
    CodeMirror = require( 'codemirror' )

require( '../node_modules/codemirror/mode/javascript/javascript.js' )
//require( '../node_modules/codemirror/addon/edit/matchbrackets.js' )
require( '../node_modules/codemirror/addon/edit/closebrackets.js' )
require( '../node_modules/codemirror/addon/hint/show-hint.js' )
require( '../node_modules/codemirror/addon/hint/javascript-hint.js' )

require( './tabs-standalone.microlib-latest.js' )

const types = [ 'live', 'max', 'midi' ]

let Environment = {
  codeMarkup: require( './codeMarkup.js' ),
  debug: false,
  _codemirror: CodeMirror,
  animationScheduler: require( './animationScheduler.js' ),
  lomView: require( './lomView.js' ),
  momView: require( './momView.js' ),
  consoleDiv:null,
  consoleList:null,
  annotations:true,
  suppressErrors:false,
  isConnected:false,

  init( gibber, domElements ) {
    Gibber = gibber
    
    // 设置默认值，兼容ES5
    domElements = domElements || {};

    this.codeMarkup = this.codeMarkup( Gibber )

    // 注册DOM元素
    this.registerDOMElements(domElements);

    this.createCodeMirror()   
    this.createSidePanel()
    this.setupSplit()
    
    // 设置侧边栏状态
    if (this.sidebar) {
      this.sidebar.isVisible = 1
    }
    
    //this.lomView.init( Gibber )
    this.animationScheduler.init( Gibber )
    this.codeMarkup.init()
    
    // 获取编辑器宽度
    if (this.editor) {
      this.editorWidth = this.editor.style.width
    }
    
    this.Storage.init()

    this.setupClockSelection()
    //this.toggleSidebar()
  },

  // 注册DOM元素
  registerDOMElements: function(elements) {
    this.sidebar = elements.sidebar || null;
    this.editor = elements.editor || null;
    this.console = elements.console || null;
    this.splitBar = elements.splitBar || null;
    this.tabsDiv = elements.tabs || null;
    this.demoTabsDiv = elements.demoTabs || null;
    this.schemaTabsDiv = elements.schemaTabs || null;
    this.lomViewDiv = elements.lomView || null;
    this.momViewDiv = elements.momView || null;
    this.maxSyncRadio = elements.maxSyncRadio || null;
    this.liveSyncRadio = elements.liveSyncRadio || null;
    this.maxDemosView = elements.maxDemosView || null;
    this.liveDemosView = elements.liveDemosView || null;
    this.consoleList = elements.consoleList || null;
  },

  setServer( server ) {
    // only reset tutorial view / change sync on first connection... reconnects don't trigger this
    if( this.isConnected === false ) {
      if( server === 'max' ) {
        // 添加安全检查
        if (Environment.schematabs && Environment.schematabs._element && Environment.schematabs._element[0]) {
          Environment.__eventFire( Environment.schematabs._element[0].firstElementChild.firstElementChild.nextSibling, 'click' )
        }
        if (Environment.demotabs && Environment.demotabs._element && Environment.demotabs._element[0]) {
          Environment.__eventFire( Environment.demotabs._element[0].firstElementChild.firstElementChild.nextSibling, 'click' )
        }
        if (this.maxSyncRadio) {
          Environment.__eventFire( this.maxSyncRadio, 'click' )
        }
        if (this.maxDemosView) {
          Environment.__eventFire( this.maxDemosView.firstElementChild.firstElementChild, 'click' )
        }
      }else if( server === 'live' ) {
        // 添加安全检查
        // if (Environment.demotabs && Environment.demotabs._element && Environment.demotabs._element[0]) 
        {
          Environment.__eventFire( Environment.demotabs._element.firstElementChild.firstElementChild, 'click' )
        }
        // if (Environment.schematabs && Environment.schematabs._element && Environment.schematabs._element[0])
        {
          Environment.__eventFire( Environment.schematabs._element.firstElementChild.firstElementChild, 'click' )
        }
        if (this.liveSyncRadio) {
          Environment.__eventFire( this.liveSyncRadio, 'click' )
        }
        if (this.liveDemosView) {
          Environment.__eventFire( this.liveDemosView.firstElementChild.firstElementChild, 'click' )
        }
      }
      this.isConnected = true
    }
  },

  __eventFire(el, etype){
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  },

  createSidePanel() {
    // 检查是否有必要的DOM元素
    if (!this.tabsDiv || !this.demoTabsDiv || !this.schemaTabsDiv) {
      return;
    }
    
    // console.log(Object(this.tabsDiv), this.demoTabsDiv, this.schemaTabsDiv);

    this.tabs = new ML.Tabs( this.tabsDiv )
    this.demotabs = new ML.Tabs( this.demoTabsDiv )
    this.schematabs = new ML.Tabs( this.schemaTabsDiv )

    this.createConsole()
    this.createDemoLists()
  },

  initLomView(gibber) {
    this.lomView.init( gibber, this.lomViewDiv )
  },

  clear() {
    if( Gibber !== null && Gibber.isStandalone === true ) {
      this.codeMarkup.clear()
      this.animationScheduler.clear()
    }
  },
  
  setupSplit() {
    // 检查是否有必要的DOM元素
    if (!this.splitBar || !this.editor || !this.sidebar) {
      return;
    }
    
    let splitDiv = this.splitBar,
        editor   = this.editor,
        sidebar  = this.sidebar,
        mousemove, mouseup

    mouseup = evt => {
      window.removeEventListener( 'mousemove', mousemove )
      window.removeEventListener( 'mouseup', mouseup )
    }

    mousemove = evt => {
      let splitPos = evt.clientX

      editor.style.width = splitPos + 'px'
      sidebar.style.left = splitPos  + 'px'
      sidebar.style.width = (window.innerWidth - splitPos) + 'px'
    }

    splitDiv.addEventListener( 'mousedown', evt => {
      window.addEventListener( 'mousemove', mousemove )
      window.addEventListener( 'mouseup', mouseup )
    })

  },

  setupClockSelection() {
    const syncs = ['max','live','clock']
    for( let sync of syncs ) {
      var radioElement = this[sync + 'SyncRadio'];
      if (radioElement) {
        radioElement.onclick = ()=> {
          Gibber.Scheduler.__sync__ = sync
          localStorage.setItem('sync', sync)
        }
      }
    }
  },

  createCodeMirror() {
    // 检查是否有编辑器元素
    if (!this.editor) {
      return;
    }
    
    CodeMirror.keyMap.gibber = this.keymap
    this.codemirror = CodeMirror( this.editor, {
      mode:'javascript', 
      keyMap:'gibber',
      autofocus:true, 
      value: Gibber.Examples.live.introduction,
      matchBrackets: true,
      autoCloseBrackets: true,
      extraKeys: {"Ctrl-Space": "autocomplete"},
      //theme:'the-matrix'
    })
    this.codemirror.setSize( null, '100%' ) 
  },

  createConsole() {
    
    //this.console = //CodeMirror( document.querySelector('#console'), { mode:'javascript', autofocus:false, lineWrapping:true })
    //this.console.setSize( null, '100%' )

    let list = document.createElement( 'ul' )

    list.setAttribute( 'id', 'console_list' )

    Environment.consoleList = list
    Environment.consoleDiv = this.console

    if (Environment.consoleDiv) {
      Environment.consoleDiv.appendChild( list )
    }
    
    Environment.overrideError()
  },

  overrideError() {
    console.__error = console.error
    console.error = function(...args) {
      Gibber.Environment.error.apply( null, args )
      console.__error.apply( console, args )
    }
  },

  replaceError() {
    console.error = console.__error
  },

  createDemoLists() {

    for( let type of types ) {
      var container = this[type + 'DemosView'];
      if (!container) continue;
      
      let list = document.createElement( 'ul' )

      for( let demoName in Gibber.Examples[ type ] ) {
        let li = document.createElement( 'li' ),
            txt = Gibber.Examples[ type ][ demoName ]
        
        li.innerText = demoName 

        li.addEventListener( 'click', () => {
          Environment.codemirror.setValue( txt )
        })
        
        list.appendChild( li )
      }
      
      container.innerHTML = ''
      container.appendChild( list )
    }
  },

  log( ...args ) {
    console.log( ...args )

    if( Gibber !== null && Gibber.isStandalone == true ) {
      let consoleItem = Environment.createConsoleItem( args )
      Environment.consoleList.appendChild( consoleItem )
      consoleItem.scrollIntoView()
      return consoleItem
    }

    
  },

  error( ...args ) {
    if( Environment.suppressErrors === false ) {
      if( args[0] === 'error Gen not authorized on this install' ) {
        Gibber.__gen.enabled = false
        //args[0] = 'error Compiling Gen graphs is not authorized for this install of Max; using genish.js for modulation'
        Gibber.log( 'Gen is not authorized on this computer; using genish.js for modulation.' )
        return
      }

      let consoleItem = Environment.createConsoleItem( args )

      consoleItem.setAttribute( 'class', 'console_error' )

      Environment.consoleList.appendChild( consoleItem )
      consoleItem.scrollIntoView()
    }
  },
  
  createConsoleItem( args ) {
    let li = document.createElement( 'li' )
    li.innerText = args.join( ' ' )

    return li
  },

  clearConsole() {
    if (this.consoleList) {
      this.consoleList.innerHTML = ''
    }
  },

  keymap : {
    fallthrough:'default',

    // execute now
    'Shift-Enter'(cm) {
      try {
        const selectedCode = Environment.getSelectionCodeColumn( cm, false )
        const func = new Function( selectedCode.code )

        Environment.flash( cm, selectedCode.selection )

        func()
      }catch( e ) {
        console.log( e )
        Environment.log( 'error with immediately executed code:', e )
      }
    },

    'Ctrl-Enter'( cm ) {
      try {
        const selectedCode = Environment.getSelectionCodeColumn( cm, false )

        Environment.flash( cm, selectedCode.selection )
        
        const func = new Function( selectedCode.code ).bind( Gibber.currentTrack ),
              markupFunction = () => {
                Environment.codeMarkup.process( 
                  selectedCode.code, 
                  selectedCode.selection, 
                  cm, 
                  Gibber.currentTrack 
                ) 
              }
        
        markupFunction.origin  = func

        const isConnected = Gibber.Communication.connected.live || Gibber.Communication.connected.max
        if( !Environment.debug && isConnected === true) {
          Gibber.Scheduler.functionsToExecute.push( func )
          if( Environment.annotations === true )
            Gibber.Scheduler.functionsToExecute.push( markupFunction  )
        }else{
          func()
          if( Environment.annotations === true )
            markupFunction()
        }
      } catch (e) {
        console.log( e )
        Environment.log( 'ERROR', e )
      }
    },
    'Alt-Enter'( cm ) {
      try {
        let selectedCode = Environment.getSelectionCodeColumn( cm, true )

        Environment.flash( cm, selectedCode.selection )
        
        let func = new Function( selectedCode.code ).bind( Gibber.currentTrack ),
            markupFunction = () => { 
              Environment.codeMarkup.process( 
                selectedCode.code, 
                selectedCode.selection, 
                cm, 
                Gibber.currentTrack 
              ) 
            }
        
        markupFunction.origin  = func

        if( !Environment.debug ) {
          Gibber.Scheduler.functionsToExecute.push( func );

          if( Environment.annotations === true )
            Gibber.Scheduler.functionsToExecute.push( markupFunction  )
        }else{
          func()

          if( Environment.annotations === true )
            markupFunction()
        }
      } catch (e) {
        console.log( e )
        Environment.log( 'ERROR', e )
      }
    },
    'Ctrl-.'( cm ) {
      Gibber.clear()
      Gibber.log( 'All sequencers stopped.' )
    },
    'Shift-Ctrl-C'( cm ) {
      Environment.toggleSidebar()
    },
    'Shift-Ctrl-P'( cm ) {
      Environment.Storage.save()
    },
    'Ctrl-S'( cm ) {
      cm.replaceSelection('.seq(\n\n)')
      cm.execCommand('goLineUp')
      cm.replaceSelection('  ')
    },
    'Shift-Ctrl-S'( cm ) {
      const value = cm.getValue()
      Environment.Storage.values.savedText = value
      Environment.Storage.save()
      log( 'code saved.' )
    },
    'Shift-Ctrl-L'( cm ) {
      const value = Environment.Storage.values.savedText
      cm.setValue( value )
      log( 'code loaded.' )
    },
    'Ctrl-,'( cm ) {
      cm.execCommand('goLineEnd')
      cm.replaceSelection(',\n')
      cm.execCommand('goLineStart')
      cm.replaceSelection('  ')
    }
  },

  toggleSidebar() {
    // 检查是否有必要的DOM元素
    if (!this.sidebar || !this.editor) {
      return;
    }
    
    this.sidebar.isVisible = !this.sidebar.isVisible
    let editor = this.editor
    if( !this.sidebar.isVisible ) {
      this.editorWidth = editor.style.width
      editor.style.width = '100%'
    }else{
      editor.style.width = this.editorWidth
    }

    this.sidebar.style.display = this.sidebar.isVisible ? 'block' : 'none'
  },

 	getSelectionCodeColumn( cm, findBlock ) {
		let pos = cm.getCursor(), 
				text = null
        
  	if( !findBlock ) {
      text = cm.getDoc().getSelection()

      if ( text === "") {
        text = cm.getLine( pos.line )
      }else{
        pos = { start: cm.getCursor('start'), end: cm.getCursor('end') }
        //pos = null
      }
    }else{
      let startline = pos.line, 
          endline = pos.line,
          pos1, pos2, sel
    
      while ( startline > 0 && cm.getLine( startline ) !== "" ) { startline-- }
      while ( endline < cm.lineCount() && cm.getLine( endline ) !== "" ) { endline++ }
    
      pos1 = { line: startline, ch: 0 }
      pos2 = { line: endline, ch: 0 }
    
      text = cm.getRange( pos1, pos2 )

      pos = { start: pos1, end: pos2 }
    }

    if( pos.start === undefined ) {
      let lineNumber = pos.line,
          start = 0,
          end = text.length

      pos = { start:{ line:lineNumber, ch:start }, end:{ line:lineNumber, ch: end } }
    }
	
		return { selection: pos, code: text }
	},

  flash(cm, pos) {
    let sel,
        cb = function() { sel.clear() }
  
    if (pos !== null) {
      if( pos.start ) { // if called from a findBlock keymap
        sel = cm.markText( pos.start, pos.end, { className:"CodeMirror-highlight" } );
      }else{ // called with single line
        sel = cm.markText( { line: pos.line, ch:0 }, { line: pos.line, ch:null }, { className: "CodeMirror-highlight" } )
      }
    }else{ // called with selected block
      sel = cm.markText( cm.getCursor(true), cm.getCursor(false), { className: "CodeMirror-highlight" } );
    }
  
    window.setTimeout(cb, 250);
  },

  Storage : {
    values : null,
    savedText: null,
    init : function() {
      Storage.prototype.setObject = function( key, value ) { this.setItem( key, JSON.stringify( value ) ); }
      Storage.prototype.getObject = function( key ) { var value = this.getItem( key ); return value && JSON.parse( value ); }

      this.values = localStorage.getObject( 'gibberwocky' )

      if ( !this.values ) {
        this.values = {
          onload:null,
          savedText:null
        }
        this.save()
      }      
    },

    save : function() {
      localStorage.setObject( "gibberwocky", this.values );
    },

    runUserSetup: function() {
      if( this.values.onload ) {
        try{
          eval( this.values.onload )
        }catch(e) {
          Environment.log( 'There was an error running your preload code:\n' + Enviroment.Storage.values.onload )
        }
      }
    }
  }
}

module.exports = Environment
