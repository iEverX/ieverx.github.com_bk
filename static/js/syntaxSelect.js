$(function () {

    stdname = {
        'bash': 'Bash',
        'sh': 'Bash',
        'c': 'Cpp',
        'cpp': 'Cpp',
        'cs': 'CSharp',
        'css': 'Css',
        'java': 'Java',
        'js': 'JScript',
        'php': 'Php',
        'py': 'Python',
        'python': 'Python',
        'rb': 'Ruby',
        'sql': 'Sql',
        'vb': 'Vb',
        'xml': 'Xml',
        'html': 'Xml',
        'perl': 'Perl'
    };

    var $t = $('pre[class^=brush]');
    if ($t.length > 0) {
        $('body').append('<script src="/static/js/syntaxhighlighter/shCore.js" type="text/javascript"></script>');
    }
    alert($('script'));
    $t.each(function() {
        var lang = stdname[$.trim($(this).attr('class').substring(6))];
        $('body').append('<script type="text/javascript" src="/static/js/syntaxhighlighter/shBrush' + lang + '.js"></script>');
    });
    if ($t.length > 0) {
        $('body').append('<script language="javascript">SyntaxHighlighter.all();</script>');
    }
    alert($('script'));
});