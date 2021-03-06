// Create View code
Template.create.onCreated(function(){
  // Needs to know all users
  this.subscribe('allUsers');
  this.subscribe('');

  this.taskPeople = new ReactiveVar(1);
  this.taskSelectedChannels = new ReactiveVar({});
  this.taskSelectedUsers = new ReactiveVar({});
  this.taskDescription = new ReactiveVar("");

  this.taskStates = [
    {
      name: 'people',
      confirmText: 'Done Selecting'
    },
    {
      name: 'number',
      confirmText: 'Continue',
    },
    {
      name: 'task',
      confirmText: 'Dispatch it!'
    }
  ];
  this.step = new ReactiveVar(0);

  this.selected = new ReactiveVar('channel');

  this.filterChannel = new ReactiveVar('');
});

Template.create.onRendered(function(){
  $('html, body').animate({
    scrollTop: 0
  }, 600);
});

Template.create.helpers({
  'totalUsers' : function(){
    return Meteor.users.find({}).count();
  },
  'taskPeople': function(){
    return Template.instance().taskPeople.get();
  },
  'confirmText': function(){
    var t = Template.instance();
    return t.taskStates[t.step.get()].confirmText;
  },
  'selected': function(item){
    return Template.instance().selected.get() === item ? 'active' : false;
  },
  'isSelectedChannel': function(){
    var channelId = this._id;
    return Template.instance().taskSelectedChannels.get()[channelId];
  },
  'isSelectedUser': function(){
    var userId = this._id;
    return Template.instance().taskSelectedUsers.get()[userId];
  },
  'isFilterChannel': function(){
    var channelId = this._id;
    return Template.instance().filterChannel.get() === channelId;
  },
  'allChannels': function(){
    return Channels.find({}, {sort: {name: 1}});
  },
  'selectedChannels': function(){
    var selectedChannels = Template.instance().taskSelectedChannels.get();
    return Object
      .keys(selectedChannels)
      .filter(function(key){
        return selectedChannels[key];
      })
      .map(function(key){
        return Channels.findOne({_id: key});
      });
  },
  'selectedUsers': function(){
    var selectedUsers = Template.instance().taskSelectedUsers.get();
    return Object
      .keys(selectedUsers)
      .filter(function(key){
        return selectedUsers[key];
      })
      .map(function(key){
        return Meteor.users.findOne({_id: key});
      });
  },
  'channelUsers': function(){
    var channel = this;
    var users = Meteor.users.find({'profile.channels':{$in: [channel._id]}}).fetch();
    return users;
  },
  'filteredUsers': function(){
    return Meteor.users.find({
      'profile.channels': {
        $in: [
          Template.instance().filterChannel.get()
        ]
      }
    });
  },
  'taskReadyClass': function(){
    var t = Template.instance();

    // Not the last step!
    if (t.step.get() < t.taskStates.length - 1){
      return;
    }

    // Check to see if the task is valid.
    var selectedUsers = t.taskSelectedUsers.get();
    selectedUsers = Object
      .keys(selectedUsers)
      .filter(function(key){
        return selectedUsers[key];
      })
      .map(function(key){
        return Meteor.users.findOne({_id: key});
      });

    var selectedChannels = t.taskSelectedChannels.get();
    selectedChannels = Object
      .keys(selectedChannels)
      .filter(function(key){
        return selectedChannels[key];
      })
      .map(function(key){
        return Channels.findOne({_id: key});
      });

    var description = t.taskDescription.get();

    if (description.length === 0){
      return 'disabled';
    }

    if (t.selected.get() === 'anyone'){
      return;
    }

    if (t.selected.get() === 'people'){
      return selectedUsers.length > 0 ? '' : 'disabled';
    }

    if (t.selected.get() === 'channel'){
      return selectedChannels.length > 0 ? '' : 'disabled';
    }

  }
});

Template.create.events({

  // Create number
  'click #inc': function(e, t){
    t.taskPeople.set(
      t.taskPeople.get() < Meteor.users.find({}).count() ?
        t.taskPeople.get() + 1 : t.taskPeople.get()
    );
    t.find('#num-people').value = t.taskPeople.get();
  },
  'click #dec': function(e, t){
    t.taskPeople.set(
      t.taskPeople.get() > 1 ?
        t.taskPeople.get() - 1 : t.taskPeople.get()
    );
    t.find('#num-people').value = t.taskPeople.get();
  },
  'keyup #num-people': function(e, t){
    var val = parseInt(e.target.value.replace(/\D/g,''));
    val = val > 0 ? val : 1;
    t.taskPeople.set(val);
    t.find('#num-people').value = t.taskPeople.get();
  },

  // Advance the state
  'click #next-step': function(e, t){

    var nextStep = t.step.get() + 1;

    // Last step!
    if (nextStep === t.taskStates.length){

      var allChannelId = Channels.findOne({name: 'all'})._id;

      // Check to see if the task is valid.
      var selectedUsers = t.taskSelectedUsers.get();
      selectedUsers = Object
        .keys(selectedUsers)
        .filter(function(key){
          return selectedUsers[key];
        });

      var selectedChannels = t.taskSelectedChannels.get();
      selectedChannels = Object
        .keys(selectedChannels)
        .filter(function(key){
          return selectedChannels[key];
        });

      var description = t.taskDescription.get();
      var numPeople = t.taskPeople.get();

      var createdTaskAlert = function(){
        sweetAlert({
          title: "Awesome!",
          text: "Your task has been dispatched.",
          type: "success",
          showCancelButton: false,
          confirmButtonText: "OK",
          closeOnConfirm: false
        }, function(){
          location.href = '/'; // rediect to home
        });
      };

      if (t.selected.get() === 'anyone'){
        Meteor.call('createTask',
          Meteor.userId(),
          [],
          [allChannelId],
          description,
          numPeople,
          numPeople);
        createdTaskAlert();
        return;
      }

      if (t.selected.get() === 'people'){
        Meteor.call('createTask',
          Meteor.userId(),
          selectedUsers,
          [],
          description,
          numPeople,
          numPeople);
        createdTaskAlert();
        return;
      }

      if (t.selected.get() === 'channel'){
        Meteor.call('createTask',
          Meteor.userId(),
          [],
          selectedChannels,
          description,
          numPeople,
          numPeople);
        createdTaskAlert();
        return;
      }

      return;
    }

    var step = t.taskStates[nextStep];

    $('html, body').animate({
      scrollTop: $('#' + step.name).offset().top - 16
    }, 600);

    $('#' + step.name).transition('scale in');

    t.step.set(nextStep);
  },

  'click #select-channel': function(e, t){
    t.selected.set('channel');
  },
  'click #select-people': function(e, t){
    t.selected.set('people');
  },
  'click #select-anyone': function(e, t){
    t.selected.set('anyone');
  },

  'click #choose-channel .segment': function(e, t){
    var channelId = this._id;
    var selected = t.taskSelectedChannels.get();
    selected[channelId] = !selected[channelId];
    t.taskSelectedChannels.set(selected);
  },

  'click #choose-people .channel .segment': function(e, t){
    var channelId = this._id;
    t.filterChannel.set(channelId);
  },

  'click #choose-people .choose-person': function(e, t){
    var userId = this._id;
    var selected = t.taskSelectedUsers.get();
    selected[userId] = !selected[userId];
    t.taskSelectedUsers.set(selected);
  },

  'keyup, blur #task-description': function(e, t){
    t.taskDescription.set(e.target.value);
  }

});