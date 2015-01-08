

var timeinput = new bb_timeinput.Views.TimeInput({});

$("#timeInput").append( timeinput.render().$el );


var timespan = new bb_timeinput.Views.TimeSpanInput();

$("#timespanInput").append( timespan.render().$el );