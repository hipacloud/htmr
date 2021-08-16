'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var htmlparser2 = require('htmlparser2');
var htmlEntities = require('html-entities');

// convert attr to valid react props
function mapAttribute(originalTag, attrs, preserveAttributes, getPropInfo) {
    if (attrs === void 0) { attrs = {}; }
    return Object.keys(attrs).reduce(function (result, attr) {
        // ignore inline event attribute
        if (/^on.*/.test(attr)) {
            return result;
        }
        // Convert attribute to camelCase except data-* and aria-* attribute
        // https://facebook.github.io/react/docs/dom-elements.html
        var attributeName = attr;
        if (!/^(data|aria)-/.test(attr)) {
            // Allow preserving non-standard attribute, e.g: `ng-if`
            var preserved = preserveAttributes.filter(function (at) {
                if (at instanceof RegExp) {
                    return at.test(attr);
                }
                return at === attr;
            });
            if (preserved.length === 0) {
                attributeName = hypenColonToCamelCase(attr);
            }
        }
        var prop = getPropInfo(originalTag, attributeName);
        if (prop.name === 'style') {
            // if there's an attribute called style, this means that the value must be exists
            // even if it's an empty string
            result[prop.name] = convertStyle(attrs.style);
        }
        else {
            var value = attrs[attr];
            // Convert attribute value to boolean attribute if needed
            // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
            var booleanAttrributeValue = value === '' ||
                String(value).toLowerCase() === attributeName.toLowerCase();
            result[prop.name] = prop.isBoolean ? booleanAttrributeValue : value;
        }
        return result;
    }, {});
}
function convertProperty(prop) {
    if (/^-ms-/.test(prop)) {
        // eslint-disable-next-line no-param-reassign
        prop = prop.substr(1);
    }
    // keep CSS custom properties as is
    if (prop.startsWith('--')) {
        return prop;
    }
    return hypenColonToCamelCase(prop);
}
function convertValue(value) {
    // value can be converted to pixel automatically by converting it to number
    if (/^\d+$/.test(value)) {
        return Number(value);
    }
    return value.replace(/'/g, '"');
}
function convertStyle(styleStr) {
    var style = {};
    styleStr
        .split(';')
        // non-empty declaration
        .filter(function (style) { return style.trim() !== ''; })
        .forEach(function (declaration) {
        var rules = declaration.split(':');
        if (rules.length > 1) {
            var prop = convertProperty(rules[0].trim());
            // handle url: attribute on style
            var val = convertValue(rules.slice(1).join(':').trim());
            style[prop] = val;
        }
    });
    return style;
}
function hypenColonToCamelCase(str) {
    // convert hypen and colon to camel case
    // color-profile -> colorProfile
    // xlink:role -> xlinkRole
    return str.replace(/(-|:)(.)/g, function (match, symbol, char) {
        return char.toUpperCase();
    });
}

var acceptcharset = "acceptCharset";
var accesskey = "accessKey";
var allowfullscreen = "allowFullScreen";
var autocomplete = "autoComplete";
var autofocus = "autoFocus";
var autoplay = "autoPlay";
var cellpadding = "cellPadding";
var cellspacing = "cellSpacing";
var charset = "charSet";
var classid = "classID";
var classname = "className";
var colspan = "colSpan";
var contenteditable = "contentEditable";
var contextmenu = "contextMenu";
var crossorigin = "crossOrigin";
var datetime = "dateTime";
var enctype = "encType";
var formaction = "formAction";
var formenctype = "formEncType";
var formmethod = "formMethod";
var formnovalidate = "formNoValidate";
var formtarget = "formTarget";
var frameborder = "frameBorder";
var hreflang = "hrefLang";
var htmlfor = "htmlFor";
var httpequiv = "httpEquiv";
var inputmode = "inputMode";
var keyparams = "keyParams";
var keytype = "keyType";
var marginheight = "marginHeight";
var marginwidth = "marginWidth";
var maxlength = "maxLength";
var mediagroup = "mediaGroup";
var minlength = "minLength";
var novalidate = "noValidate";
var radiogroup = "radioGroup";
var readonly = "readOnly";
var rowspan = "rowSpan";
var spellcheck = "spellCheck";
var srcdoc = "srcDoc";
var srclang = "srcLang";
var srcset = "srcSet";
var tabindex = "tabIndex";
var usemap = "useMap";
var viewbox = "viewBox";
var attributes = {
	"for": "htmlFor",
	"class": "className",
	acceptcharset: acceptcharset,
	accesskey: accesskey,
	allowfullscreen: allowfullscreen,
	autocomplete: autocomplete,
	autofocus: autofocus,
	autoplay: autoplay,
	cellpadding: cellpadding,
	cellspacing: cellspacing,
	charset: charset,
	classid: classid,
	classname: classname,
	colspan: colspan,
	contenteditable: contenteditable,
	contextmenu: contextmenu,
	crossorigin: crossorigin,
	datetime: datetime,
	enctype: enctype,
	formaction: formaction,
	formenctype: formenctype,
	formmethod: formmethod,
	formnovalidate: formnovalidate,
	formtarget: formtarget,
	frameborder: frameborder,
	hreflang: hreflang,
	htmlfor: htmlfor,
	httpequiv: httpequiv,
	inputmode: inputmode,
	keyparams: keyparams,
	keytype: keytype,
	marginheight: marginheight,
	marginwidth: marginwidth,
	maxlength: maxlength,
	mediagroup: mediagroup,
	minlength: minlength,
	novalidate: novalidate,
	radiogroup: radiogroup,
	readonly: readonly,
	rowspan: rowspan,
	spellcheck: spellcheck,
	srcdoc: srcdoc,
	srclang: srclang,
	srcset: srcset,
	tabindex: tabindex,
	usemap: usemap,
	viewbox: viewbox
};

function htmrServer(html, options) {
    if (options === void 0) { options = {}; }
    if (typeof html !== 'string') {
        throw new TypeError('Expected HTML string');
    }
    var doc = htmlparser2.parseDocument(html.trim(), {});
    var nodes = doc.childNodes.map(function (node, index) {
        return toReactNode(node, index.toString(), options);
    });
    return nodes.length === 1 ? nodes[0] : nodes;
}
var TABLE_ELEMENTS = ['table', 'tbody', 'thead', 'tfoot', 'tr'];
function toReactNode(childNode, key, options) {
    var transform = options.transform || {};
    var preserveAttributes = options.preserveAttributes || [];
    var dangerouslySetChildren = options.dangerouslySetChildren || ['style'];
    var defaultTransform = transform._;
    switch (childNode.type) {
        case 'script':
        case 'style':
        case 'tag': {
            var node = childNode;
            var name_1 = node.name, attribs_1 = node.attribs;
            // decode all attribute value
            Object.keys(attribs_1).forEach(function (key) {
                attribs_1[key] = htmlEntities.decode(attribs_1[key]);
            });
            var props = Object.assign({}, mapAttribute(name_1, attribs_1, preserveAttributes, getPropInfo), { key: key });
            var customElement = transform[name_1];
            // if the tags children should be set dangerously
            if (dangerouslySetChildren.indexOf(name_1) > -1) {
                // Tag can have empty children
                if (node.children.length > 0) {
                    var childNode_1 = node.children[0];
                    var html = name_1 === 'style' || name_1 === 'script'
                        ? // preserve encoding on style & script tag
                            childNode_1.data.trim()
                        : htmlEntities.encode(childNode_1.data.trim());
                    props.dangerouslySetInnerHTML = { __html: html };
                }
                return customElement
                    ? React.createElement(customElement, props, null)
                    : defaultTransform
                        ? defaultTransform(name_1, props, null)
                        : React.createElement(name_1, props, null);
            }
            var childNodes = node.children
                .map(function (node, index) { return toReactNode(node, index.toString(), options); })
                .filter(Boolean);
            // self closing component doesn't have children
            var children = childNodes.length === 0 ? null : childNodes;
            if (customElement) {
                return React.createElement(customElement, props, children);
            }
            if (defaultTransform) {
                return defaultTransform(name_1, props, children);
            }
            return React.createElement(name_1, props, children);
        }
        case 'text': {
            var node = childNode;
            var str = node.data;
            if (node.parent && TABLE_ELEMENTS.indexOf(node.parent.name) > -1) {
                str = str.trim();
                if (str === '') {
                    return null;
                }
            }
            str = htmlEntities.decode(str);
            return defaultTransform ? defaultTransform(str) : str;
        }
    }
}
var attrs = attributes;
function getPropInfo(_originalTag, attributeName) {
    var propName = attrs[attributeName] || attributeName;
    return {
        name: propName,
        isBoolean: BOOLEAN_ATTRIBUTES.includes(propName),
    };
}
var BOOLEAN_ATTRIBUTES = [
    // https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/packages/react-dom/src/shared/DOMProperty.js#L319
    'allowFullScreen',
    'async',
    // Note: there is a special case that prevents it from being written to the DOM
    // on the client side because the browsers are inconsistent. Instead we call focus().
    'autoFocus',
    'autoPlay',
    'controls',
    'default',
    'defer',
    'disabled',
    'disablePictureInPicture',
    'disableRemotePlayback',
    'formNoValidate',
    'hidden',
    'loop',
    'noModule',
    'noValidate',
    'open',
    'playsInline',
    'readOnly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    // Microdata
    'itemScope',
];

module.exports = htmrServer;
