

inlets = 1;
outlets = 1;


var m_events = [];
var m_play = 0;

function play(mode)
{
  m_play = mode;
  if(m_play === 0) {
	m_events.length = 0;
  }
}
	
function add()
{
	if(m_play===0) {
		return;
	}
	
	var a = arrayfromargs(messagename, arguments);
	a.splice(0,1);
	m_events.push(a);
}


function dispatch(start, end)
{
  for(var index in m_events) {
	var e = m_events[index];
	if(e[0] >= start && e[0] <= end) {
	  e.splice(0, 1);  
      outlet(0, e);
      e.__played = true; 	  
	}
  }
	
  for(var index = m_events.length - 1; index >= 0; --index ) {
	var e = m_events[index];
	if(e.__played===true) {
      m_events.splice(index, 1);
	}
  }
}


// play_note.local = 1;