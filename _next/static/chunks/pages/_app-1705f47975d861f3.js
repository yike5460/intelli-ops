(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[888],{6840:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return t(4848)}])},4848:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return App}});var r=t(5893);t(415);var o=t(7294),initQueue=()=>{window.va||(window.va=function(...e){(window.vaq=window.vaq||[]).push(e)})};function isBrowser(){return"undefined"!=typeof window}function detectEnvironment(){return"production"}function isDevelopment(){return"development"===function(){let e=isBrowser()?window.vam:detectEnvironment();return e||"production"}()}function Analytics(e){return(0,o.useEffect)(()=>{!function(e={debug:!0}){var n;if(!isBrowser())return;(function(e="auto"){if("auto"===e){window.vam=detectEnvironment();return}window.vam=e})(e.mode),initQueue(),e.beforeSend&&(null==(n=window.va)||n.call(window,"beforeSend",e.beforeSend));let t=e.scriptSrc||(isDevelopment()?"https://va.vercel-scripts.com/v1/script.debug.js":"/_vercel/insights/script.js");if(document.head.querySelector(`script[src*="${t}"]`))return;let r=document.createElement("script");r.src=t,r.defer=!0,r.dataset.sdkn="@vercel/analytics"+(e.framework?`/${e.framework}`:""),r.dataset.sdkv="1.3.1",e.disableAutoTrack&&(r.dataset.disableAutoTrack="1"),e.endpoint&&(r.dataset.endpoint=e.endpoint),e.dsn&&(r.dataset.dsn=e.dsn),r.onerror=()=>{let e=isDevelopment()?"Please check if any ad blockers are enabled and try again.":"Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";console.log(`[Vercel Web Analytics] Failed to load script from ${t}. ${e}`)},isDevelopment()&&!1===e.debug&&(r.dataset.debug="false"),document.head.appendChild(r)}({framework:e.framework||"react",...void 0!==e.route&&{disableAutoTrack:!0},...e})},[]),(0,o.useEffect)(()=>{e.route&&e.path&&function({route:e,path:n}){var t;null==(t=window.va)||t.call(window,"pageview",{route:e,path:n})}({route:e.route,path:e.path})},[e.route,e.path]),null}function App(e){let{Component:n,pageProps:t}=e;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n,{...t}),(0,r.jsx)(Analytics,{})]})}},415:function(){}},function(e){var __webpack_exec__=function(n){return e(e.s=n)};e.O(0,[774,179],function(){return __webpack_exec__(6840),__webpack_exec__(9974)}),_N_E=e.O()}]);