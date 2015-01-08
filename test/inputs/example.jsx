module.exports = React.createClass({
    
    render: function() {
      var title = (
        <Tr>translated text</Tr>
        <Tr plural="translated texts with plural">translated text' with plural</Tr>
        <Tr context="My context">translated text with context</Tr>
        <Tr plural="translated text's with plural and context" count="1" context="context" args={args}>translated text with plural and context</Tr>
      );
    }
});
