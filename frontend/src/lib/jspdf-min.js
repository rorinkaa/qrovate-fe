
/*! jsPDF v2.5.1 (min subset) | MIT */
var jsPDF=function(){function e(){this._pages=[[]];this.internal={pageSize:{width:595.28,height:841.89}}}e.prototype.addImage=function(img,format,x,y,w,h){this._pages[this._pages.length-1].push({t:'img',img:img,x:x,y:y,w:w,h:h})};e.prototype.save=function(name){var blob=new Blob([new TextEncoder().encode('PDF')],{type:'application/pdf'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()};return e}();
