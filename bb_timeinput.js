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
			switch(key){

				case "hour":
					if(this._checkHour( value )){
						checkedAttributes.hour = value;
					}
					break;

				case "minutes":
					if(this._checkMinutes( value )){
						checkedAttributes.minutes = value;
					}
					break;
			}
		}, this);

		if(!_.isEmpty(checkedAttributes)){
			return Backbone.Model.prototype.set.call(this, checkedAttributes, options);
		}

		return false;

	},

	_checkMinutes: function(minutes){

		if(_.isUndefined(minutes))
			return true;

		minutes = Number(minutes);

		if(
			isNaN( minutes )
			|| minutes < 0
			|| minutes > 59
		){
			return false;
		}

		return true;
	},

	_checkHour: function(hour){

		if(_.isUndefined(hour))
			return true;

		hour = Number(hour);

		if(
			isNaN( hour )
			|| hour < 0
			|| hour > 24
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

	model: (function(){ return new bb_timeinput.Models.Time() })(),

	template: _.template( $("#tpl-time-input").html() ),

	events: {
		"change :input": "_handleChange",
		"keyup :input": "_handleInput"
	},

	render: function(){
		this.setElement( this.template({
			hour: this.model.get("hour"),
			minutes: this.model.get("minutes")
		}) );

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

	_handleInput: function(event){

		if(
			(event.keyCode >= 48 && event.keyCode <= 90)
			|| (event.keyCode >= 96 && event.keyCode <= 105)
		){
			var $target = $(event.target);
			var value = $target.val();

			if(value.length >= 2){
				this._handleChange(event);
			}
		}



	},

	_handleChange: function(event){
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

			if(this.options.afterModelChange){
				this.options.afterModelChange( newValue, type, this );
			}

			$target.focus();

		}else{

			$target.removeClass("wrongValue");

			if(this.options.inputError){
				this.options.inputError( newValue, type, this );
			}
			$target.val(newValue);	// to be sure it is cleaned of all other crap like spaces and so on
			var $next = $target.next(":input");
			if($next.length > 0){
				$next.focus();
			}else{
				$target.blur();
				this.trigger("finished");
			}
		}
	}

});



bb_timeinput.Models.TimeSpan = Backbone.Model.extend({

	defaults: {
		start: (function(){ return new bb_timeinput.Models.Time() })(),
		end: (function(){ return new bb_timeinput.Models.Time() })()
	}

});



bb_timeinput.Views.TimeSpanInput = bb_timeinput.Views.Base.extend({

	template: _.template($("#tpl-time-span-input").html()),

	model: (function(){ return new bb_timeinput.Models.TimeSpan() })(),

	timeinput: bb_timeinput.Views.TimeInput,

	start: undefined,
	end: undefined,

	initialize: function(options){
		bb_timeinput.Views.Base.prototype.initialize.call(this, options);

		this.start = new this.timeinput(this.options);
		this.end = new this.timeinput(this.options);

		this.listenTo(this.start, "finished", function(event){
			this.end.$el.find(":input:first").focus();
		}, this);

	},

	render: function(){

		var $el = $(this.template({}));

		$el.find(".start").html( this.start.render().$el );
		$el.find(".end").html( this.end.render().$el );

		this.setElement( $el );

		return this;

	}


})