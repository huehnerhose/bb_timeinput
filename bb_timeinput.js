var bb_timeinput = {
	Models: {},
	Views: {}
}


bb_timeinput.options = 	{
	suggestions: undefined,
	readonly: undefined,

	afterChange: undefined,
	afterModelChange: undefined,

	inputError: undefined
};


bb_timeinput.Models.Time = Backbone.Model.extend({
	defaults: {
		hour: undefined,
		minutes: undefined
	},

	set: function(key, val, options){
		var attributes, checkedAttributes = {};

		if(_.isObject(key)){
			attributes = key;
			options = val;
		}else{
			(attributes = {})[key] = val;
		}

		_.each(attributes, function(value, key){
			if(_.contains( ["hour", "minutes"], key )){

				if( _.isUndefined(value) || value === "" ){
					checkedAttributes[key] = undefined; // neede for initialization
				}else{

					value = Number(value);

					if(this._checkInput(value, key)){
						checkedAttributes[key] = value;
					}
				}

			}
		}, this);


		if(!_.isEmpty(checkedAttributes)){
			return Backbone.Model.prototype.set.call(this, checkedAttributes, options);
		}

	},

	isValid: function(){
		var valid = false;

		return ( this._isMinutes( this.get("minutes") ) && this._isHour( this.get("hour") ) );
	},

	_checkInput: function(value, key){

		if(isNaN(value))
			return false;

		switch(key){
			case "minutes":
				return this._isMinutes(value);
				break;
			case "hour":
				return this._isHour(value);
				break;
		}

	},

	_isMinutes: function(minutes){

		if(
			minutes < 0
			|| minutes > 59
			|| _.isUndefined( minutes )
		){
			return false;
		}

		return true;
	},

	_isHour: function(hour){

		if(
			hour < 0
			|| hour > 24
			|| _.isUndefined( hour )
		){
			return false;
		}

		return true;

	}

});


bb_timeinput.Views.Base = Backbone.View.extend({
	options: bb_timeinput.options,

	initialize: function(options){
		if(_.isObject(options)){

			_.each(options, function(val, key){

				if(_.has(this.options, key)){
					this.options[key] = val;
				}

			}, this);
		}

	},
})


bb_timeinput.Views.TimeInput = bb_timeinput.Views.Base.extend({

	template: _.template( $("#tpl-time-input").html() ),

	changeFocus: false,

	events: {
		"blur :input": "_handleBlur",
		"input :input": "_handleInput"
	},

	initialize: function(options){
		bb_timeinput.Views.Base.prototype.initialize.call(this, options);

		this.model = new bb_timeinput.Models.Time({
			minutes: 	options.minutes,
			hour: 		options.hour
		});

		this.listenTo(this.model, "change", this._updateInputs);
	},

	render: function(){
		var renderSet =  {
			hour: 	 	this.model.get("hour"),
			minutes: 	(_.isset(this.model.get("minutes"))) ?
							(this.model.get("minutes").toString().length < 2) ?
								"0" + this.model.get("minutes").toString()
								: this.model.get("minutes").toString()
							: undefined
		}

		this.setElement( this.template(renderSet) );

		this.delegateEvents();

		return this;
	},


	getTime: function(){
		return {
			hour: this.model.get("hour"),
			minutes: this.model.get("minutes")
		}
	},

	getTimeString: function(){
		var minutes = this.model.get("minutes").toString();
		if(minutes.length === 1){
			minutes = "0" + minutes;
		}
		return this.model.get("hour").toString() + ":" + minutes;
	},

	getTimeInMinutes: function(){
		return this.model.get("minutes") + ( this.model.get("hour")*60 );
	},

	isValid: function(){
		return this.model.isValid();
	},

	_updateInputs: function(){
		var hour = this.model.get("hour");
		var min = this.model.get("minutes");

		if(!_.isUndefined( hour )){
			this.$el.find(":input[name=hour]").val( this.model.get("hour") );
		}

		if( !_.isUndefined(min) ){
			min = min.toString();
			if(min.length == 1)
				min = "0" + min;

			this.$el.find(":input[name=minutes]").val( min );
		}

	},

	_handleBlur: function(event){

		event.stopPropagation();

		this._handleChange(event, this.changeFocus);
		this.changeFocus = false;
	},

	_handleInput: function(event){

		event.stopPropagation();

		var $target = $(event.target);
		var value = $target.val();

		if(value.length >= 2){
			// this._handleChange(event, true);
			this.changeFocus = true;
			$target.blur();
		}



	},

	_handleChange: function(event, changeFocus){

		var $target = $(event.target);
		var type = $target.prop("name");

		var newValue = $target.val();

		// Trigger possible Callback, is hook for altering the value manually
		if(this.options.afterChange){
			var callbackReturn = this.options.afterChange( newValue, type, this );
			if(!_.isUndefined(callbackReturn)){
				newValue = callbackReturn;
			}
		}


		// try to set value in model, let model do the validation
		if(!this.model.set(type, newValue )){
			// Value was wrong
			$target.val("").addClass("wrongValue");

			if(this.options.inputError){
				this.options.inputError( newValue, type, this );
			}

			if(changeFocus)
				$target.focus();

		}else{

			$target.removeClass("wrongValue");

			if(this.model.isValid()){
				this.trigger("modelChange");
			}

			if(this.options.afterModelChange){


				this.options.afterModelChange( newValue, type, this );
			}
			$target.val(newValue);	// to be sure it is cleaned of all other crap like spaces and so on

			var $next = $target.next(":input");

			if(changeFocus){
				if($next.length > 0){
					$next.focus();
				}else{
					this.trigger("finished");
				}
			}

		}
	}

});

/*
	options:
		timeStart/timeEnd -> if "int" -> "minutes since 00:00"
*/

bb_timeinput.Views.TimeSpanInput = bb_timeinput.Views.Base.extend({

	template: _.template($("#tpl-time-span-input").html()),

	timeinput: bb_timeinput.Views.TimeInput,

	start: undefined,
	end: undefined,



	// input OPtions with mapping to internal stuff
	possibleTimeInputOptions: {
		timeStart: 	"start",
		timeEnd: 	"end"
	},

	input: undefined,

	initialize: function(options){
		bb_timeinput.Views.Base.prototype.initialize.call(this, options);

		this.input = {};

		_.each(this.possibleTimeInputOptions, function(mapTo, option){
			if( _.has(options, option) )
				this.input[mapTo] = this._validateInputTime( options[option] );
		}, this);


		this.start = new this.timeinput(
			this.input.start ? _.extend({}, this.options, this.input.start) : this.options
		);

		this.end = new this.timeinput(
			this.input.end ? _.extend({}, this.options, this.input.end) : this.options
		);

		this.listenTo(this.start, "finished", function(event){
			this.end.$el.find(":input:first").focus();
		}, this);

		this.listenTo(this.end, "finished", function(event){
			this.trigger("finished");
		}, this);

		this.listenTo(this.start, "modelChange", function(event){
			if(this.end.model.isValid())
				this.trigger("timeChange");
		});

		this.listenTo(this.end, "modelChange", function(event){
			if(this.start.model.isValid())
				this.trigger("timeChange");
		});

	},

	render: function(){

		var $el = $(this.template({}));
		$start = this.start.render().$el
		$el.find(".start").html( $start );
		$end = this.end.render().$el
		$el.find(".end").html( $end );

		this.setElement( $el );

		return this;

	},

	getTimespan: function(){
		return {
			start: this.start.getTime(),
			end: this.end.getTime()
		}
	},

	getTimespanString: function(){
		return this.start.getTimeString() + "-" + this.end.getTimeString();
	},

	getTimespanMinutes: function(){
		return {
			start: this.start.getTimeInMinutes(),
			end: this.end.getTimeInMinutes()
		};
	},

	isValid: function(){
		return ( this.start.isValid() && this.end.isValid() );
	},

	_validateInputTime: function(inputTime){
		if(_.isString( inputTime ))
			return this._validateAsString(inputTime);

		if(_.isNumber( inputTime ))
			return this._validateAsNumber(inputTime);

		if(_.isObject( inputTime ))
			return this._validateAsObject(inputTime);

		return undefined;
	},

	_validateAsNumber: function(inputTime){

		if(inputTime > 1440){
			// we assume we have seconds since 00:00
			inputTime = moment.duration(inputTime, "seconds");
		}else{
			// we assume we habe minutes since 00:00
			inputTime = moment.duration(inputTime, "minutes");
		}

		return {
			hour: inputTime.hours(),
			minutes: inputTime.minutes()
		};

	}

})