var bb_timeinput = {
	Models: {},
	Views: {}
}


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

bb_timeinput.Views.TimeInput = Backbone.View.extend({

	model: bb_timeinput.Models.Time,

	template: _.template( $("#tpl-time-input").html() ),


	options: {
		suggestions: undefined,
		readonly: undefined,

		afterChange: undefined,
		afterModelChange: undefined,

		inputError: undefined
	},

	events: {
		"change :input": "_handleChange"
	},

	initialize: function(options){
		if(_.isObject(options)){

			_.each(options, function(val, key){

				if(_.has(this.options, key)){
					this.options[key] = val;
				}

			}, this);
		}

		// _.extend(this, this.options);

		this.model = new this.model();

	},

	render: function(){
		this.setElement( this.template({
			hour: this.model.get("hour"),
			minutes: this.model.get("minutes")
		}) );

		this.delegateEvents();

		return this;
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

			$target.next(":input").focus();
		}
	}

});