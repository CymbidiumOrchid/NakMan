function KeyButton(x, y) {
    'use strict';

    var dom = this.domElement = document.createElement("div");
    dom.className = "keybutton";
    dom.style.left = x + "px";
    dom.style.top = y + "px";
}