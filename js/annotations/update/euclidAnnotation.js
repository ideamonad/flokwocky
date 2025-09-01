const Utility = require( '../../utility.js' )
const $ = Utility.create

const newFunc = ( patternObject, marker, className, cm, track ) => {
  let val ='/* ' + patternObject.values.join('')  + ' */',
      pos = marker.find(),
      end = Object.assign( {}, pos.to ),
      annotationStartCh = pos.from.ch + 3,
      annotationEndCh   = annotationStartCh + 1,
      commentMarker

  end.ch = pos.from.ch + val.length
  pos.to.ch -= 1
  
  commentMarker = cm.attachComment( pos.from, pos.from, val, className );

  patternObject.commentMarker = commentMarker;

  track.markup.textMarkers[ className ] = {}

  let mark = () => {
    for( let i = 0; i < patternObject.values.length; i++ ) {
      const offset = i + 3;
      commentMarker.setContentClassName(offset, offset + 1, `${className}_${i}`);
      track.markup.textMarkers[ className ][ i ] = commentMarker;
    }
  }

  mark()

  let count = 0, span, update, activeSpans = []

  update = () => {
    let currentIdx = count++ % patternObject.values.length

    if( span !== undefined ) {
      span.remove( 'euclid0' )
    }

    let spanName = `.${className}_${currentIdx}`,
        currentValue = patternObject.values[ currentIdx ]

    span = $( spanName )

    // deliberate ==
    if( currentValue == 1 ) {
      span.add( 'euclid1' )
      activeSpans.push( span )
      setTimeout( ()=> { 
        activeSpans.forEach( _span => _span.remove( 'euclid1' ) )
        activeSpans.length = 0 
      }, 50 )
    }else{
      span.add( 'euclid0' )
    }
  }

  patternObject._onchange = () => {
    let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )

    Gibber.Environment.animationScheduler.add( () => {
      let newComment ='/* ' + patternObject.values.join('')  + ' */';
      patternObject.commentMarker.setComment(newComment);
      mark()
    }, delay ) 
  }

  patternObject.clear = () => {
    if( !patternObject.commentMarker ) {
      return;
    }

    patternObject.commentMarker.clear();
    delete patternObject.commentMarker;

    console.log("----euclidAnnotation clear");
    // console.log(new Error().stack);

  }

  return update 
}

const oldFunc = ( patternObject, marker, className, cm, track ) => {
  let val ='/* ' + patternObject.values.join('')  + ' */',
      pos = marker.find(),
      end = Object.assign( {}, pos.to ),
      annotationStartCh = pos.from.ch + 3,
      annotationEndCh   = annotationStartCh + 1,
      memberAnnotationStart   = Object.assign( {}, pos.from ),
      memberAnnotationEnd     = Object.assign( {}, pos.to ),
      initialized = false,
      markStart = null,
      commentMarker,
      currentMarker, chEnd

  end.ch = pos.from.ch + val.length

  pos.to.ch -= 1
  cm.replaceRange( val, pos.from, pos.to )

  patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false })

  track.markup.textMarkers[ className ] = {}

  let mark = () => {
    // first time through, use the position given to us by the parser
    let range,start, end
    if( initialized === false ) {
      memberAnnotationStart.ch = annotationStartCh
      memberAnnotationEnd.ch   = annotationEndCh
      initialized = true
    }else{
      // after the first time through, every update to the pattern store the current
      // position of the first element (in markStart) before replacing. Use this to generate position
      // info. REPLACING TEXT REMOVES TEXT MARKERS.
      range = markStart
      start = range.from
      memberAnnotationStart.ch = start.ch
      memberAnnotationEnd.ch = start.ch + 1 
    }

    for( let i = 0; i < patternObject.values.length; i++ ) {
      track.markup.textMarkers[ className ][ i ] = cm.markText(
        memberAnnotationStart,  memberAnnotationEnd,
        { 'className': `${className}_${i}` }
      )

      memberAnnotationStart.ch += 1
      memberAnnotationEnd.ch   += 1
    }

    if( start !== undefined ) {
      start.ch -= 3
      end = Object.assign({}, start )
      end.ch = memberAnnotationEnd.ch + 3
      patternObject.commentMarker = cm.markText( start, end, { className, atomic:true })
    }
  }

  mark()

  // XXX: there's a bug when you sequence pattern transformations, and then insert newlines ABOVE the annotation
  let count = 0, span, update, activeSpans = []

  update = () => {
    let currentIdx = count++ % patternObject.values.length

    if( span !== undefined ) {
      span.remove( 'euclid0' )
    }

    let spanName = `.${className}_${currentIdx}`,
        currentValue = patternObject.values[ currentIdx ]

    span = $( spanName )

    // deliberate ==
    if( currentValue == 1 ) {
      span.add( 'euclid1' )
      activeSpans.push( span )
      setTimeout( ()=> { 
        activeSpans.forEach( _span => _span.remove( 'euclid1' ) )
        activeSpans.length = 0 
      }, 50 )
    }else{
      span.add( 'euclid0' )
    }
  }

  patternObject._onchange = () => {
    let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
    markStart = track.markup.textMarkers[ className ][ 0 ].find()

    Gibber.Environment.animationScheduler.add( () => {
      for( let i = 0; i < patternObject.values.length; i++ ) {

        let markerCh = track.markup.textMarkers[ className ][ i ],
          pos = markerCh.find()

        marker.doc.replaceRange( '' + patternObject.values[ i ], pos.from, pos.to )
      }
      mark()
    }, delay ) 
  }

  patternObject.clear = () => {
    //soloit
    if( !patternObject.commentMarker ) {
      return;
    }

    const commentPos = patternObject.commentMarker.find()

    // if this gets called twice...
    if( commentPos === undefined ) return

    // 结尾的位置为什么要+1?
    // cm.replaceRange( '', commentPos.from, { line:commentPos.to.line, ch:commentPos.to.ch+1 } )
    cm.replaceRange( '', commentPos.from, { line:commentPos.to.line, ch:commentPos.to.ch } )

    patternObject.commentMarker.clear();
    //soloist
    delete patternObject.commentMarker;
  }

  return update 
}

module.exports = newFunc;