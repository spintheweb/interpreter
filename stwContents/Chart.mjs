/*!
 * chart
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { DOMParser as xmldom } from '@xmldom/xmldom';

import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Content from '../stwElements/Content.mjs';

export default class Chart extends Content {
    constructor(name, template, lang) {
        super(name, template, lang, true);
    }

    render(socket) {
        let document;

        // Safe colors
        const colors = ['#5DA5DA', '#4D4D4D', '#FAA43A', '#60BD68', '#F17CB0', '#B2912F', '#B276B2', '#DECF3F', '#F15854'];

        return super.render(socket, () => {
            let fragment = donut(100, [{
                "label": "FIAT",
                "value": [10]
            }, {
                "label": "ALFA",
                "value": [20]
            }, {
                "label": "LANCIA",
                "value": [40]
            }, {
                "label": "AUDI",
                "value": [25]
            }, {
                "label": "OTHER",
                "value": [5]
            }], {});
            return fragment;
        });

        // Helper functions
        function setAttributes(element, attrs) {
            for (let key in attrs) element.setAttribute(key, attrs[key]);
        }

        // document.createElementNS('http://www.w3.org/2000/svg', tagName); // Not necessary with modern browsers
        function createSVGElement(tagName, attrs) {
            if (tagName === 'svg')
                document = new xmldom().parseFromString('<svg/>');
            let obj = document.createElement(tagName);
            setAttributes(obj, attrs);
            return obj;
        }
        function circle(r, cx, cy, attrs) {
            let obj = createSVGElement('circle', {
                'r': Math.round(r),
                'cx': Math.round(cx),
                'cy': Math.round(cy)
            });
            setAttributes(obj, attrs);
            return obj;
        }
        function rect(x, y, w, h, attrs) {
            let obj = createSVGElement('rect', {
                'x': Math.round(x),
                'y': Math.round(y),
                'width': Math.round(w),
                'height': Math.round(h)
            });
            setAttributes(obj, attrs);
            return obj;
        }
        function text(x, y, txt, attrs) {
            let obj = createSVGElement('text', { 'x': Math.round(x), 'y': Math.round(y), 'text-anchor': 'middle' });
            setAttributes(obj, attrs);
            obj.textContent = txt;
            return obj;
        }

        function grid(w, h, xmin, xmax, ymin, ymax, options) {
            let obj = createSVGElement('g');

            // Grid: optionally present
            let dx = Math.floor((xmax - xmin) / w), dy = Math.floor((ymax - ymin) / h);
            let factor = Math.floor(Math.log(dx) / Math.log(10));

            if (!options || options['grid'] !== false) {
                let d = '';
                for (let i = Math.max(w, h); i >= 0; i -= 10)
                    d += 'M0 ' + i + ' H' + w + ' M' + i + ' 0 V' + h + ' ';
                obj.appendChild(createSVGElement('path', {
                    'class': 'grid',
                    'd': d,
                    'data-param': null
                }));
            }
            // Axes: always present
            obj.appendChild(createSVGElement('path', {
                'class': 'axes',
                //            'd': 'M' + -Math.floor(xo * sx) + ',0 V' + h + ' M0,' + h + Math.floor(yo * sy) + ' H' + w
            }));
            /*        
                    let xo = Math.min.apply(Math, data[0].value), sx = w / (Math.max.apply(Math, data[0].value) - xo), yo = Number.POSITIVE_INFINITY, sy;
                    for (let s = 1; s < data.length; ++s) {
                        yo = Math.min(yo, Math.min.apply(Math, data[s].value)), sy = h / (Math.max.apply(Math, data[s].value) - yo);
                    }
                    sy *= 0.9;
            */
            return obj;
        }

        // Data argument includes one or more data sets each includes an array and optionally labels.
        function line(w, h, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'line',
                'width': w,
                'height': h
            });
            // Points
            if (data.length > 1) {
                let xmin = Math.min.apply(Math, data[0].value), xmax = Math.max.apply(Math, data[0].value), ymin = Number.POSITIVE_INFINITY, ymax = Number.NEGATIVE_INFINITY;
                for (let s = 1; s < data.length; ++s) {
                    ymin = Math.min(ymin, Math.min.apply(Math, data[s].value)), ymax = Math.max(ymax, Math.max.apply(Math, data[s].value));
                }

                svg.appendChild(grid(w, h, xmin, xmax, ymin, ymax, options));

                let sx = w / (xmax - xmin), sy = h / (ymax - ymin);
                for (let s = 1; s < data.length; ++s) {
                    let points = '', I = Math.min(data[0].value.length, data[s].value.length);
                    for (let i = 0; i < I; ++i) {
                        let x = (data[0].value[i] - xmin) * sx, y = h - (data[s].value[i] - ymin) * sy;
                        svg.appendChild(circle(3, x, y, { 'style': 'stroke:none;fill:' + colors[(s - 1) % 9] }));
                        points += Math.round(x) + ',' + Math.round(y) + ' ';
                    }
                    svg.appendChild(createSVGElement('polyline', {
                        'style': 'stroke:' + colors[(s - 1) % 9],
                        'points': points
                    }));
                }
            } else {
                // At least two data sets
            }
            return svg;
        }
        function polar(r, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'polar',
                'width': 2 * r,
                'height': 2 * r
            });
            let xmin = Math.min.apply(Math, data[0].value), xmax = Math.max.apply(Math, data[0].value), ymin = Number.POSITIVE_INFINITY, ymax = Number.NEGATIVE_INFINITY;
            for (let s = 1; s < data.length; ++s) {
                ymin = Math.min(ymin, Math.min.apply(Math, data[s].value)), ymax = Math.max(ymax, Math.max.apply(Math, data[s].value));
            }

            // x, y & r, theta
            if (!options || options['mode'] !== 'XY') {
                for (let i = 0; i < data[0].value.length; ++i) {
                    for (let s = 1; s < data.length; ++s) {
                        data[s].value[i] *= Math.sin(data[0].value[i]);
                    }
                    //                   data[s].value[i] *= Math.sin(data[0].value[i]);
                }
            }

            return svg;
        }
        function histogram(w, h, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'histogram',
                'width': w,
                'height': h
            });
            let mh = 0, Mh = Number.NEGATIVE_INFINITY;
            for (let s = 0; s < data.length; ++s) {
                mh = Math.min(mh, Math.min.apply(Math, data[s].value)), Mh = Math.max(Mh, Math.max.apply(Math, data[s].value));
            }
            // Grid
            let dh = 0.95 * h / (Mh - mh), d = '';
            if (!options || options['grid'] != false) {
                for (let i = w; i >= 0; i -= 10)
                    d += 'M0 ' + i + ' H' + w + ' ';
                svg.appendChild(createSVGElement('path', {
                    'class': 'grid',
                    'd': d
                }));
            }
            // Bars
            let dw = (w - (data[0].value.length + 1)) / (data.length * data[0].value.length);
            for (let i = 0; i < data[0].value.length; ++i) {
                for (let s = 0; s < data.length; ++s) {
                    let element;
                    if (data[s].value[i] > 0)
                        element = rect((s + data.length * i) * dw + i, h - (data[s].value[i] - mh) * dh, dw - 1, data[s].value[i] * dh, { 'style': 'fill:' + colors[s % 9] });
                    else
                        element = rect((s + data.length * i) * dw + i, h + (mh * dh), dw - 1, -data[s].value[i] * dh, { 'style': 'fill:' + colors[s % 9] });
                    svg.appendChild(element);
                }
            }
            // Axes
            svg.appendChild(createSVGElement('path', {
                'class': 'axes',
                'd': 'M0,0 V' + h + ' M0,' + Math.floor(h + mh * dh) + ' H' + w
            }));
            return svg;
        }
        function pie(r, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'pie',
                'width': 2 * r,
                'height': 2 * r
            });
            let sum = 0, s;
            for (s = 0; s < data.length; ++s)
                sum += data[s].value[0];
            if (sum > 0 && s > 1) {
                let startAngle, endAngle = 0;
                for (let s = 0; s < data.length; ++s) {
                    startAngle = endAngle;
                    endAngle = startAngle + 2.0 * Math.PI * data[s].value[0] / sum;
                    let slice = createSVGElement('path', {
                        'style': 'fill:' + colors[s % 9],
                        'd': 'M' + r + ',' + r + ' L' + Math.floor(r + r * Math.cos(startAngle)) + ',' + Math.floor(r + r * Math.sin(startAngle)) + ' A' + r + ',' + r + ' 0 ' + (2.0 * data[s].value[0] > sum ? 1 : 0) + ',1 ' + Math.floor(r + r * Math.cos(endAngle)) + ',' + Math.floor(r + r * Math.sin(endAngle))
                    });
                    let title = createSVGElement('title');
                    title.textContent = data[s].label + ' ' + Math.floor(1000 * data[s].value[0] / sum) / 10.0 + '%';
                    slice.appendChild(title);
                    svg.appendChild(slice);
                }
            } else
                svg.appendChild(circle(r, r, r, { 'style': 'fill:' + colors[0] }));
            return svg;
        }
        function donut(r, data, options) {
            let svg = pie(r, data, options);
            if (svg.firstChild.tagName !== 'circle') svg.appendChild(circle(0.667 * r, r, r));
            svg.setAttribute('class', 'donut');
            return svg;
        }
        function bubble(w, h, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'bubble',
                'width': w,
                'height': h
            });
            if (data.length === 3) {
                let xo = Math.min.apply(Math, data[0].value), sx = w / (Math.max.apply(Math, data[0].value) - xo),
                    yo = Math.min(yo, Math.min.apply(Math, data[1].value)), sy = h / (Math.max.apply(Math, data[1].value) - yo);

                if (!options || options['grid'] != false)
                    svg.appendChild(grid(w, h));

                sy *= 0.9;
                // Axes
                svg.appendChild(createSVGElement('path', {
                    'class': 'axes',
                    'd': 'M' + -Math.floor(xo * sx) + ',0 V' + h + ' M0,' + h + Math.floor(yo * sy) + ' H' + w
                }));

                let I = data[0].value.length;
                for (let i = 0; i < I; ++i) {
                    let x = (data[0].value[i] - xo) * sx, y = h - (data[1].value[i] - yo) * sy;
                    svg.appendChild(circle(data[2].value[i], x, y, { 'style': 'fill:none;stroke:' + colors[0] }));
                }
            }
            return svg;
        }
        function map(w, h, data, options) {
            let svg = createSVGElement('svg');
            return svg;
        }
        function radar(r, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'radar',
                'width': 2 * r,
                'height': 2 * r
            });
            let m = Number.POSITIVE_INFINITY, M = Number.NEGATIVE_INFINITY;
            for (let s = 0; s < data.length; ++s)
                m = Math.min(m, Math.min.apply(Math, data[s].value)), M = Math.max(M, Math.max.apply(Math, data[s].value));
            let dr = Math.abs(M - m);

            // Axes
            let a = 2 * Math.PI / data[0].value.length, d = '';
            for (let i = 0; i < data[0].value.length; ++i)
                d += 'M' + r + ',' + r + ' l' + Math.floor(r * Math.cos(a * i)) + ',' + Math.floor(r * Math.sin(a * i)) + ' ';
            svg.appendChild(createSVGElement('path', {
                'd': d
            }));
            svg.appendChild(circle(r * Math.abs(m) / dr, r, r, { 'style': 'fill:none' }));
            // Points
            for (let s = 0; s < data.length; ++s) {
                let points = '';
                for (let i = 0; i < data[s].value.length; ++i) {
                    let x = Math.floor(r + r * (data[s].value[i] - m) / dr * Math.cos(a * i)), y = Math.floor(r + r * (data[s].value[i] - m) / dr * Math.sin(a * i));
                    points += x + ',' + y + ' ';
                    svg.appendChild(circle(3, x, y, { 'style': 'stroke:none;fill:' + colors[s % 9] }));
                }
                svg.appendChild(createSVGElement('polygon', {
                    'style': 'stroke:' + colors[s % 9],
                    'points': points
                }));
            }
            return svg;
        }
        function gauge(r, data, options) {
            let panel = document.createElement('span');

            let m = 0, M = 1.0;
            if (options && options['min']) m = options['min'];
            if (options && options['max']) M = options['max'];

            for (let s = 0; s < data.length; ++s) {
                let svg = createSVGElement('svg', {
                    'class': 'gauge',
                    'width': 2 * r,
                    'height': 2 * r
                }),
                    sr = Math.floor(0.667 * r),
                    v = (data[s].value - m) / (M - m);

                if (data[s].pages === undefined) data[s].pages = '';
                svg.appendChild(text(r, r, data[s].value + data[s].pages, { 'font-size': Math.floor(0.333 * r) + 'px' }));
                svg.appendChild(text(r, Math.floor(1.4 * r), data[s].label, { 'font-size': Math.floor(0.25 * r) + 'px' }));
                v = 1.0 - (v - Math.floor(v));
                let element = createSVGElement('path', {
                    'd': 'M0,' + r + ' A' + r + ',' + r + ' 0 1,1 ' + Math.floor(r + r) + ',' + r + ' H' + Math.floor(r + sr) + ' A' + sr + ',' + sr + ' 0 0,0 ' + (r - sr) + ',' + r + ' z'
                });
                svg.appendChild(element);
                element = createSVGElement('path', {
                    'style': 'stroke:none;fill:' + colors[s % 9],
                    'd': 'M0,' + r + ' A' + r + ',' + r + ' 0 0,1 ' + Math.floor(r + r * Math.cos(Math.PI * v)) + ',' + Math.floor(r - r * Math.sin(Math.PI * v)) +
                        ' L' + Math.floor(r + sr * Math.cos(Math.PI * v)) + ',' + Math.floor(r - sr * Math.sin(Math.PI * v)) + ' A' + sr + ',' + sr + ' 0 0,0 ' + (r - sr) + ',' + r + ' z'
                });
                svg.appendChild(element);
                panel.appendChild(svg);
            }
            return panel;
        }
        function gantt(w, h, data, options) {
            let svg = createSVGElement('svg', {
                'class': 'gantt',
                'width': w,
                'height': h
            });
            let text = createSVGElement('text');
            text.textContent = 'GANTT';
            svg.appendChild(text);
            return svg;
        }
    };
}