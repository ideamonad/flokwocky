const newFunc = ( patternObject, marker, className, cm ) => {
  // debugger;

  patternObject.commentMarker = marker
  
  let update = () => {
    if( !patternObject.commentMarker ){
      return;
    }

    let patternValue = '' + patternObject.update.value.pop()

    let val ='/* ' + patternValue + ' */'

    // 换内容
    patternObject.commentMarker.setComment(val);
    patternObject.commentMarker.setClassName(className);
  }

  patternObject.clear = () => {
    if( patternObject.commentMarker ){
      patternObject.commentMarker.clear()
      delete patternObject.commentMarker
      console.log("anonymousAnnotation clear");
    } 
  }

  return update
}

const oldFunc = ( patternObject, marker, className, cm ) => {
  patternObject.commentMarker = marker
  let update = () => {
    if( !patternObject.commentMarker ) return
    let patternValue = '' + patternObject.update.value.pop()

    if( patternValue.length > 8 ) patternValue = patternValue.slice(0,8) 

    let val ='/* ' + patternValue + ' */',
      pos = patternObject.commentMarker.find(),
      end = Object.assign( {}, pos.to )

    //pos.from.ch += 1
    end.ch = pos.from.ch + val.length 
    //pos.from.ch += 1

    cm.replaceRange( val, pos.from, pos.to )


    if( patternObject.commentMarker ) {
      //soloist
      patternObject.commentMarker.clear();
      delete patternObject.commentMarker;
    }

    patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false })
  }

  patternObject.clear = () => {
    try{
      let commentPos = patternObject.commentMarker.find()
      //commentPos.to.ch -= 1 // XXX wish I didn't have to do this
      cm.replaceRange( '', commentPos.from, commentPos.to )
      patternObject.commentMarker.clear()
      delete patternObject.commentMarker
    } catch( e ) {} // yes, I just did that XXX 
  }

  return update
}

module.exports = newFunc;