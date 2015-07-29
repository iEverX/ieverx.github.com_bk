var React = require('react');
var _ = require('lodash');
// var $ = require('jquery');
var classNames = require('classnames');
require('./tag.css');

var FilterType = {
    AND: 'AND',
    OR: 'OR'
};
var FilterMethod = {};
FilterMethod[FilterType.OR] = function(tags) {
    var results = [];
    tags.forEach(function(tag) {
        results = results.concat(tag.posts);
    });
    var finder = {};
    var merged = [];
    results.forEach(function(r) {
        if (!finder[r.url]) {
            finder[r.url] = 1;
            merged.push(r);
        }
    });
    return _.sortBy(merged, function(r) {
        return r.date;
    }).reverse();
};
FilterMethod[FilterType.AND] = function(tags) {
    var finder = {};
    var m = [];
    tags.forEach(function(tag) {
        var urls = [];
        tag.posts.forEach(function(p) {
            if (!finder[p.url]) {
                finder[p.url] = p;
            }
            urls.push(p.url);
        });
        m.push(urls);
    });
    var unique = _.intersection.apply(null, m)
    var ans = _.values(_.pick(finder, unique))
    return _.sortBy(ans, function(r) {
        return r.date;
    }).reverse();
};
function nextFilterState(filter) {
    switch (filter) {
        case FilterType.AND:
            return FilterType.OR
        case FilterType.OR:
            return FilterType.AND;
        default:
            return FilterType.AND;
    }
}

var CandidateTag = React.createClass({
    render: function() {
        var classes = classNames('candidate', 'tag', {
            selected: this.props.selected
        });
        return (
            <span className={classes} onClick={this.handleClick}>{this.props.text}</span>
        );
    },
    handleClick: function() {
        this.props.onTagClick(this.props.text);
    }
});

var CandidateTagBox = React.createClass({
    getInitialState() {
        return {display: true};
    },
    render: function() {
        var tags = this.props.tags.map(function(tag) {
            return (
                <CandidateTag key={tag.text}
                        selected={tag.selected}
                        text={tag.text}
                        onTagClick={this.props.onCandidateTagClick}/>
            );
        }.bind(this));
        if (this.state.display) {
            var tagsStyle = {
                display: this.state.display ? '' : 'none',
                marginLeft: 61,
            };
            var stateStyle = {
                background: '#00A8FF',
                color: '#fff',
                width: 50,
                textAlign: 'center',
                position: 'absolute',
                top: 0,
                bottom: 0
            };
            var innerStyle = {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                margin: 'auto',
                height: 24
            }
            return (
                <div className="candidate-box">
                    <div className='tag' style={stateStyle} onClick={this.handleClick}>
                        <div style={innerStyle}>{this.state.display ? 'HIDE' : 'SHOW'}</div>
                    </div>
                    <div style={tagsStyle}>{tags}</div>
                </div>
            )
        } else {
            var style = {
                background: '#00A8FF',
                color: '#fff',
                width: 50,
                textAlign: 'center'
            }
            return (
                <div className='candidate-box'>
                    <div className='tag' style={style} onClick={this.handleClick}>{this.state.display ? 'HIDE' : 'SHOW'}</div>
                </div>
            )
        }
    },
    handleClick: function() {
        this.setState({display: !this.state.display})
    }
});

var FilterTag = React.createClass({
    render: function() {
        return <span className="filter tag"
                onClick={this.handleClick}>
            {this.props.text}
        </span>
    },
    handleClick: function() {
        this.props.onTagClick(this.props.text);
    }
});

var FilterSwitcher = React.createClass({
    render: function() {
        var style = {
            background: 'rgb(0, 168, 255)',
            color: '#fff',
            width: 50,
            textAlign: 'center'
        };
        return (
            <span className='tag' style={style} onClick={this.handleClick}>{this.props.filter}</span>
        )
    },
    handleClick: function() {
        this.props.onFilterSwitch(this.props.filter);
    }
});

var FilterInput = React.createClass({
    render: function() {
        var inputStyle = {
            padding: '3px 5px',
            margin: 3,
            outline: 'none'
        };
        var clearStyle = {
            background: '#00A8FF',
            color: '#fff',
            width: 50,
            textAlign: 'center'
        }
        return (
            <div>
                <input type="text"
                    style={inputStyle}
                    onKeyDown={this.handleKeyDown}
                    onBlur={this.handleBlur}/>
                <span className="tag"
                    style={clearStyle}
                    onClick={this.props.onClear}>Clear</span>
            </div>
        )
    },
    handleKeyDown: function(e) {
        if (e.which == 13) {
            var text = e.target.value.trim();
            this.props.onTagInput(text);
            e.target.value = '';
        }
    },
    handleBlur: function(e) {
        var text = e.target.value.trim();
        this.props.onTagInput(text);
        e.target.value = '';
    }
});

var FilterTagBox = React.createClass({
    render: function() {
        var tags = this.props.tags.map(function(tag) {
            return <FilterTag key={tag.text} text={tag.text} onTagClick={this.props.onTagSelected} />
        }.bind(this));
        return (
            <div className='filter-tag-box'>
                <FilterSwitcher filter={this.props.filter} onFilterSwitch={this.props.onFilterSwitch}/>
                {tags}
                <FilterInput onTagInput={this.handleTagInput}
                    onClear={this.props.onClear}/>
            </div>
        )
    },
    handleTagInput: function(text) {
        return this.props.onTagSelected(text, true);
    }
});

var Result = React.createClass({
    render: function() {
        return (
            <li>
                <a href={this.props.url}>{this.props.text}</a>
                <span>{this.props.date}</span>
            </li>
        )
    }
});

var ResultBox = React.createClass({
    render: function() {
        var results = this.props.results.map(function(r) {
            return (
                <Result key={r.url} url={r.url} text={r.title} date={r.date} />
            );
        });
        return (
            <ul className='result-box'>{results}</ul>
        );
    }
});

var TagFilter = React.createClass({
    getInitialState: function() {
        return {tags: this.props.tags, filter: FilterType.AND};
    },
    // componentDidMount: function() {
    //     $.ajax({
    //         url: this.props.url,
    //         dataType: 'json',
    //         success: function(data) {
    //             data.forEach(function(tag) {
    //                 tag.selected = false;
    //             })
    //             this.setState({tags: data});
    //         }.bind(this),
    //         error: function(xhr, status, err) {
    //             console.error(this.props.url, status, err.toString());
    //         }.bind(this)
    //     });
    // },
    render: function() {
        var filterTags = this.state.tags.filter(function(tag) {
            return tag.selected;
        });
        return (
            <div>
                <CandidateTagBox tags={this.state.tags}
                        onCandidateTagClick={this.handleTagSelected} />
                <FilterTagBox tags={filterTags}
                        filter={this.state.filter}
                        onTagSelected={this.handleTagSelected}
                        onFilterSwitch={this.handleFilterSwitch}
                        onClear={this.handleClear} />
                <ResultBox results={FilterMethod[this.state.filter](filterTags)} />
            </div>
        )
    },
    handleFilterSwitch: function(filter) {
        this.setState({filter: nextFilterState(filter)})
    },
    handleTagSelected: function(text, selected) {
        var tag = this.state.tags.map(function(t) {
            if (t.text.toUpperCase() === text.toUpperCase()) {
                var m = t;
                m.selected = selected === undefined ? !m.selected : true
                return m;
            }
            return t;
        });
        this.setState({tags: this.state.tags});
    },
    handleClear: function() {
        this.state.tags.forEach(function(tag) {
            tag.selected = false;
        });
        this.setState({tags: this.state.tags});
    }
});

React.render(
    <TagFilter tags={tags}/>,
    document.getElementById('root')
);
