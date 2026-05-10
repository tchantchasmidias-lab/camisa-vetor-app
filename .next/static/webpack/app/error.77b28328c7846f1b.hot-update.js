/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/error",{

/***/ "(app-pages-browser)/./app/error.tsx":
/*!***********************!*\
  !*** ./app/error.tsx ***!
  \***********************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": function() { return /* binding */ Error; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var _lib_i18n_GeoContext__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/i18n/GeoContext */ \"(app-pages-browser)/./lib/i18n/GeoContext.tsx\");\n/* harmony import */ var _lib_i18n_GeoContext__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lib_i18n_GeoContext__WEBPACK_IMPORTED_MODULE_1__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\nfunction Error(param) {\n    let { error, reset } = param;\n    _s();\n    const { t } = (0,_lib_i18n_GeoContext__WEBPACK_IMPORTED_MODULE_1__.useGeo)();\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"flex flex-col items-center justify-center h-screen\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h2\", {\n                className: \"text-xl font-bold uppercase tracking-widest text-gray-900 mb-2\",\n                children: t(\"somethingWentWrong\")\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\M\\xe1rcio\\\\Documents\\\\Camisa-vetor-app\\\\app\\\\error.tsx\",\n                lineNumber: 16,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                className: \"text-gray-500 mb-4\",\n                children: error.message\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\M\\xe1rcio\\\\Documents\\\\Camisa-vetor-app\\\\app\\\\error.tsx\",\n                lineNumber: 19,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                onClick: ()=>reset(),\n                className: \"bg-[#fe7302] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-orange-100 hover:bg-black transition-all\",\n                children: t(\"tryAgain\")\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\M\\xe1rcio\\\\Documents\\\\Camisa-vetor-app\\\\app\\\\error.tsx\",\n                lineNumber: 20,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\M\\xe1rcio\\\\Documents\\\\Camisa-vetor-app\\\\app\\\\error.tsx\",\n        lineNumber: 15,\n        columnNumber: 5\n    }, this);\n}\n_s(Error, \"zFcWP5paqKtjWULfLgCZ5Sd1E9E=\", false, function() {\n    return [\n        _lib_i18n_GeoContext__WEBPACK_IMPORTED_MODULE_1__.useGeo\n    ];\n});\n_c = Error;\nvar _c;\n$RefreshReg$(_c, \"Error\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9lcnJvci50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRStDO0FBRWhDLFNBQVNDLE1BQU0sS0FNN0I7UUFONkIsRUFDNUJDLEtBQUssRUFDTEMsS0FBSyxFQUlOLEdBTjZCOztJQU81QixNQUFNLEVBQUVDLENBQUMsRUFBRSxHQUFHSiw0REFBTUE7SUFFcEIscUJBQ0UsOERBQUNLO1FBQUlDLFdBQVU7OzBCQUNiLDhEQUFDQztnQkFBR0QsV0FBVTswQkFDWEYsRUFBRTs7Ozs7OzBCQUVMLDhEQUFDSTtnQkFBRUYsV0FBVTswQkFBc0JKLE1BQU1PLE9BQU87Ozs7OzswQkFDaEQsOERBQUNDO2dCQUNDQyxTQUFTLElBQU1SO2dCQUNmRyxXQUFVOzBCQUVURixFQUFFOzs7Ozs7Ozs7Ozs7QUFJWDtHQXZCd0JIOztRQU9SRCx3REFBTUE7OztLQVBFQyIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9hcHAvZXJyb3IudHN4PzI0NDMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyB1c2VHZW8gfSBmcm9tICdAL2xpYi9pMThuL0dlb0NvbnRleHQnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBFcnJvcih7XG4gIGVycm9yLFxuICByZXNldCxcbn06IHtcbiAgZXJyb3I6IEVycm9yICYgeyBkaWdlc3Q/OiBzdHJpbmcgfTtcbiAgcmVzZXQ6ICgpID0+IHZvaWQ7XG59KSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlR2VvKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGgtc2NyZWVuXCI+XG4gICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCB0ZXh0LWdyYXktOTAwIG1iLTJcIj5cbiAgICAgICAge3QoJ3NvbWV0aGluZ1dlbnRXcm9uZycpfVxuICAgICAgPC9oMj5cbiAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS01MDAgbWItNFwiPntlcnJvci5tZXNzYWdlfTwvcD5cbiAgICAgIDxidXR0b25cbiAgICAgICAgb25DbGljaz17KCkgPT4gcmVzZXQoKX1cbiAgICAgICAgY2xhc3NOYW1lPVwiYmctWyNmZTczMDJdIHRleHQtd2hpdGUgcHgtMTAgcHktNCByb3VuZGVkLTJ4bCBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy1bMC4yZW1dIHRleHQtWzEwcHhdIHNoYWRvdy14bCBzaGFkb3ctb3JhbmdlLTEwMCBob3ZlcjpiZy1ibGFjayB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICA+XG4gICAgICAgIHt0KCd0cnlBZ2FpbicpfVxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59Il0sIm5hbWVzIjpbInVzZUdlbyIsIkVycm9yIiwiZXJyb3IiLCJyZXNldCIsInQiLCJkaXYiLCJjbGFzc05hbWUiLCJoMiIsInAiLCJtZXNzYWdlIiwiYnV0dG9uIiwib25DbGljayJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/error.tsx\n"));

/***/ }),

/***/ "(app-pages-browser)/./lib/i18n/GeoContext.tsx":
/*!*********************************!*\
  !*** ./lib/i18n/GeoContext.tsx ***!
  \*********************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ })

});