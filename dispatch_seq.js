

inlets = 1;
outlets = 1;


var m_events = [];
var m_play = 0;

function play(mode)
{
  m_play = mode;
  if(m_play === 0) {
	m_events = [];
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
  var during = function (e) {
    return (e[0] >= start && e[0] <= end);
  };

  var notDuring = function (e) {
	return !during(e);
  };

  var focus = m_events.filter(during);
  m_events = m_events.filter(notDuring);

  for(var index in focus) {
	var e = focus[index];
	e.splice(0, 1);
    outlet(0, e); 
  }
}


// play_note.local = 1;