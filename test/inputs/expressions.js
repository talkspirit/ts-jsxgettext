var templates = {
  "pin_verification": {
      landing: 'pin_verification',
    subject: test.gettext("Confirm email address for Persona"),
    subject2: test.gettext.call(test, "Confirm email address for Persona 2"),
    subject3: test.something.someotherthing['gettext'].call(test, "Confirm email address for Persona 3", somethingelse),
    subject4: test.gettext("String with plural", "Strings with plurals"),
    subject5: test.gettext("String with context", {context:"Context"}),
    subject6: test.gettext("String with context and plural", "Strings with context and plurals", {context:"Context"}),
  }
};

test.something.someotherthing.random.call(test, "I shall not exist", somethingelse);