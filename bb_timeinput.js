
insitu.UI.Models.Time = Backbone.Model.extend({
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
					checkedAttributes.hour = this._checkHour( value );
					break;
				case "minutes":
					checkedAttributes.minutes = this._checkMinutes( value );
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
			return undefined;
		}

		return minutes;
	},

	_checkHour: function(hour){

		hour = Number(hour);

		if(
			isNaN( hour )
			|| hour < 0
			|| hour > 24
		){
			return undefined;
		}

		return hour;

	}

});

insitu.UI.Views.TimeInput = Backbone.View.extend({

	model: insitu.UI.Models.Time,

	template: _.template( $("#tpl-time-input").html() ),

	suggestions: undefined,
	readonly: undefined,

	initialize: function(options){
		_.defaults(options, {
			readonly: false,
			suggestions: [],
		});

		this.suggestions = options.suggestions;
		this.readonly = options.readonly;

		if(!_.isUndefined(options.model) && options.model instanceof insitu.UI.Models.Time ){
			this.model = options.model;
		}else{
			this.model = new this.model();
		}

	},

	render: function(){
		debugger;
	}

});

// insitu.UI.Views.TimeSpanInput