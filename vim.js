/* Javascript edition of VIM
 * Author: Kai Zhang
 */

function Vim() {
	this.currentMode=null;
	this.instance=null;
	this.TabLength=8;
	this.currentRow=0;
	this.currentCol=0;
	this.fileHandle=null;
	this.upload="off"; //indicate whether upload is active
	var timer;

	var cmdline="";
	var commands={};
	commands.selector=null;
	commands.quantifier="";
	commands.flush=false; //whether quantifier should be flushed, when selector is set, subsequent quantifier should flush previous one.
	commands.setSelector=function(selector) {
		this.selector=selector;
		this.flush=true;
	}
	commands.getQuantifier=function() {
		if(this.quantifier=="") {
			return 1;
		} else {
			return Number(this.quantifier);
		}
	}
	commands.reset=function() {
		this.selector=null;
		this.quantifier="";
		this.flush=false;
	}

	var clipboard=new Array();
	
	this.init=function() {
		this.instance=document.getElementById("VIM");
		this.instance.innerHTML="<tr><td END></td></tr>";
		this.currentRow=0;
		this.currentCol=0;
		this.currentMode="Command Mode";
		document.addEventListener("keypress",function(event){vim.keyEvent(event)},false);
		document.addEventListener("keydown",function(event){vim.specialKeyEvent(event)},false);
		flash(this.instance.rows[this.currentRow].cells[this.currentCol]);
	}
	this.input=function(keyCode) {
		//stop flash
		clearTimeout(timer);
		var preCell=this.instance.rows[this.currentRow].cells[this.currentCol];
		preCell.className="";

		var character=String.fromCharCode(keyCode);
		var td=this.instance.rows[this.currentRow].insertBefore(document.createElement("td"),preCell);
		td.innerHTML=character;
		//begin flash
		this.moveCaret(1,0,false);
	}
	this.specialKeyEvent=function(event) {
		if(this.upload=="on") {
			setTimeout(function(){
				document.getElementById("fake").focus();
				//document.getElementById("file").blur();
			},1);
		this.upload="off";
		document.getElementById('notice-wrap').style.top="-50px";
		}
		//disable default action of some keys
		switch(true) {
			case (event.keyCode==27): //"Esc"
				if(this.currentMode=="Insert Mode") {
					this.moveCaret(-1,0,false);
				}
				this.currentMode="Command Mode";
				document.getElementById('mode').innerHTML=this.currentMode;
				commands.reset();
				break;
			case (event.keyCode==8): //"Backspace"
				event.preventDefault();
				if(this.currentMode=="Insert Mode") {
					this.stopFlash();
					 //delete previous td
					 if(this.instance.rows[this.currentRow].cells[this.currentCol].previousSibling) {
						 this.instance.rows[this.currentRow].removeChild(this.instance.rows[this.currentRow].cells[this.currentCol-1]);
						 this.moveCaret(-1,0,true);
					 }
					 else if(this.instance.rows[this.currentRow].previousSibling) {
						 this.instance.removeChild(this.instance.rows[this.currentRow]);
						 this.moveCaret(this.instance.rows[this.currentRow-1].cells.length-1,-1,true);
					 }
				} else if(this.currentMode=="Visual Mode") {
					this.moveCaret(-1,0,false);
				} else if(this.currentMode=="Cmdline Mode") {
					cmdline=cmdline.slice(0,-1);
					document.getElementById('mode').innerHTML=cmdline;
				}
				break;
			case (event.keyCode==9): //"Tab"
				event.preventDefault();
				if(this.currentMode=="Insert Mode") {
					var td=document.createElement("td");
					td.innerHTML="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
					this.instance.rows[this.currentRow].insertBefore(td,this.instance.rows[this.currentRow].cells[this.currentCol]);
					this.moveCaret(1,0,true);
					td=null;
				}
				break;
			default:;
		}
	}
	this.keyEvent=function(event) {

//{{{ Command Mode
		if(this.currentMode=="Command Mode") {
			if(commands.selector=="r") {
				this.instance.rows[this.currentRow].cells[this.currentCol].innerHTML=String.fromCharCode(event.which);
				commands.reset();
			} else {
			switch(true) {
				case (event.which==48): //"0"
					if(commands.flush||commands.quantifier=="") {
						this.moveCaret(-this.currentCol,0,false);
					} else {
						commands.quantifier+=String.fromCharCode(event.which);
					}
					break;
				case (event.which==36): //"$"
					this.moveCaret(this.instance.rows[this.currentRow].cells.length-this.currentCol-2,0,false);
					break;
				case (event.which>48&&event.which<58): //"1-9"
					if(commands.flush) {
						commands.quantifier=String.fromCharCode(event.which);
						commands.flush=false;
					} else {
						commands.quantifier+=String.fromCharCode(event.which);
					}
					break;
				case (event.which==115): //"s"
					this.currentMode="Style Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					break;
				case (event.which==100): //"d"
					if(!commands.selector) {
						commands.setSelector('d');
					} else if(commands.selector=='d') {
						this.clipboard=new Array(); //clear clipboard
						for(var i=0;i<commands.getQuantifier();i++) {
							this.stopFlash();
							if(this.instance.rows.length!=this.currentRow+1) { //if not at last row
								this.clipboard.unshift(this.delRow(this.currentRow));
								this.moveCaret(0,0,false);
							} else {
								this.clipboard.unshift(this.delRow(this.currentRow));
								if(this.instance.rows.length==0) { //if there is no row left, add new row
									this.instance.innerHTML="<tr><td END></td></tr>";
									this.moveCaret(-this.currentCol,0,false);
								} else {
									this.moveCaret(-this.currentCol,-1,false);
								}
								break;
							}
						}
						commands.reset();
					} else {
						commands.reset();
					}
					break;
				case (event.which==108): //"l"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(commands.getQuantifier(),0,false);
						commands.reset();
					}
					break;
				case (event.which==71): //"G"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(-this.currentCol,this.instance.rows.length-1-this.currentRow,false);
						commands.reset();
					}
					break;
				case (event.which==104): //"h"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(-commands.getQuantifier(),0,false);
						commands.reset();
					}
					break;
				case (event.which==105): //"i"
					this.currentMode="Insert Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					break;
				case (event.which==106): //"j"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(0,commands.getQuantifier(),false);
						commands.reset();
					}
					this.scrollDown();
					break;
				case (event.which==107): //"k"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(0,-commands.getQuantifier(),false);
						commands.reset();
					}
					this.scrollUp();
					break;
				case (event.which==111||event.which==79): //"o" or "O"
					this.currentMode="Insert Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;

					var td=document.createElement('td');
					td.setAttribute('END','');
					var tr=document.createElement('tr');
					tr.appendChild(td);
					//create new row
					if(event.which==79) { //"O"
						this.stopFlash();
						this.instance.insertBefore(tr,this.instance.rows[this.currentRow]);
						this.moveCaret(0,0,false);
					} else { //"o"
						if(this.instance.rows.length==this.currentRow-1) {  //check if at the end row
						this.instance.appendChild(tr);
						} else {
							this.instance.insertBefore(tr,this.instance.rows[this.currentRow+1]);
						}
						this.moveCaret(0,1,false);
					}
					td=null;
					tr=null;
					break;
				case (event.which==112): //"p"
					if(this.clipboard.length>0) {
						if(this.clipboard[0].nodeName=="TR") {
							for(var i=0;i<this.clipboard.length;i++) {
								if(this.instance.rows.length==this.currentRow-1) {  //check if at the end row
									this.instance.appendChild(this.clipboard[i].cloneNode(true));
								}
								else { //insert after current row
									this.instance.insertBefore(this.clipboard[i].cloneNode(true),this.instance.rows[this.currentRow+1]);
								}
							}
							this.moveCaret(-this.currentCol,1,false);
						} else {
						}
					} 
					break;
				case (event.which==80): //"P"
					if(this.clipboard.length>0) {
						if(this.clipboard[0].nodeName=="TR") {
							this.stopFlash();
							for(var i=0;i<this.clipboard.length;i++) {
								 this.instance.insertBefore(this.clipboard[i].cloneNode(true),this.instance.rows[this.currentRow]);
							}
							this.moveCaret(-this.currentCol,0,false);
						} else {
						}
					}
					break;
				case (event.which==97): //"a"
					this.currentMode="Insert Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					this.moveCaret(1,0,true);
					break;
				case (event.which==98): //"b"
					if(commands.selector) {
						commands.reset();
					} else {
						for(var i=0;i<Number(commands.getQuantifier());i++) {
							this.backwardByWord();
						}
						commands.reset();
					}
					break;
				case (event.which==114): //"r"
					if(commands.selector) {
						commands.reset();
					} else {
						commands.setSelector('r');
					}
					break;
				case (event.which==82): //"R"
					this.currentMode="Replace Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					commands.reset();
					break;
				case (event.which==118): //"v"
					this.currentMode="Visual Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					commands.reset();
					break;
				case (event.which==119): //"w"
					if(commands.selector) {
						switch(commands.selector) {
							case 'd':
								for(var i=0;i<commands.getQuantifier();i++) {
									this.delByWord();
								}
								break;
							default:;
						}
						commands.reset();
					} else {
						for(var i=0;i<Number(commands.getQuantifier());i++) {
							this.forwardByWord();
						}
						commands.reset();
					}
					break;
				case (event.which==120): //"x"
					if(commands.selector) {
						commands.reset();
					} else {
						this.clipboard=new Array(); //clipboard reset
						var i=0;
						if(this.instance.rows[this.currentRow].cells.length>1) { //if current row is empty except the end cell
							while(i<commands.getQuantifier()&&!this.instance.rows[this.currentRow].cells[this.currentCol].hasAttribute("END")) {
								this.clipboard.unshift(this.instance.rows[this.currentRow].removeChild(this.instance.rows[this.currentRow].cells[this.currentCol]));
								i++;
							}
							this.moveCaret(0,0,false);
						} else {
							break;
						}
						commands.reset();
					}
					break;
				case (event.which==121): //"y"
					if(!commands.selector) {
						commands.setSelector('y');
					} else if(commands.selector=='y') {
						this.clipboard=new Array(); //clipboard reset
						this.stopFlash();
						var i=0;
						while(i<commands.getQuantifier()&&this.instance.rows.length!=this.currentRow+i) {
							this.clipboard.unshift(this.instance.rows[this.currentRow+i].cloneNode(true));
							i++;
						}
						flash(this.instance.rows[this.currentRow].cells[this.currentCol]);
						commands.reset();
					} else {
						commands.reset();
					}
					break;
				case (event.which==58): //":"
					this.currentMode="Cmdline Mode";
					cmdline=":";
					commands.reset();
					document.getElementById('mode').innerHTML=cmdline;
				default:;
			}}
		}
//}}}
//{{{ Insert Mode
		else if(this.currentMode=="Insert Mode") {
			switch(event.which) {
				case 8: //"Backspace in FF"
					break;
				case 0: //some meta keys in FF"
					break;
				case 13: //"Enter"
					 //create new row
					 if(this.instance.rows.length==this.currentRow-1) {
						 this.instance.appendChild(document.createElement("tr"));
					 }
					 else {
						 this.instance.insertBefore(document.createElement("tr"),this.instance.rows[this.currentRow+1]);
					 }
					 //cut all following cells except the end cell
					 while(!this.instance.rows[this.currentRow].cells[this.currentCol].hasAttribute('END')) {
						 this.instance.rows[this.currentRow+1].appendChild(this.instance.rows[this.currentRow].cells[this.currentCol]);
					 }
					 //add ending cell
					 var td=document.createElement('td');
					 td.setAttribute('END','');
					 this.instance.rows[this.currentRow+1].appendChild(td);
					 td=null;
					 this.moveCaret(-this.currentCol,1,true);
					 break;
				default:
					 this.read(String.fromCharCode(event.which));
					 this.moveCaret(1,0,true);
			}
		}
//}}}
//{{{ Visual Mode
		else if(this.currentMode=="Visual Mode") {
			switch(true) {
				case (event.which==108): //"l"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(Number(commands.getQuantifier()),0,false);
						commands.reset();
					}
					break;
				case (event.which==104): //"h"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(-Number(commands.getQuantifier()),0,false);
						commands.reset();
					}
					break;
				case (event.which==105): //"i"
					this.currentMode="Insert Mode";
					document.getElementById('mode').innerHTML=vim.currentMode;
					break;
				case (event.which==106): //"j"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(0,Number(commands.getQuantifier()),false);
						commands.reset();
					}
					break;
				case (event.which==107): //"k"
					if(commands.selector) {
						commands.reset();
					} else {
						this.moveCaret(0,-Number(commands.getQuantifier()),false);
						commands.reset();
					}
					break;
				default:
					break;
			}
		}
//}}}
//{{{ Cmdline Mode
		else if(this.currentMode=="Cmdline Mode") {
			switch(event.which) {
				case 8: //"Backspace in FF"
					break;
				case 9: //"Tab in FF"
					break;
				case 13: //"Enter"
					this.cmdEva(cmdline);
					this.currentMode="Command Mode";
					document.getElementById('mode').innerHTML=this.currentMode;
					break;
				default:
					cmdline+=String.fromCharCode(event.which);
					document.getElementById('mode').innerHTML=cmdline;
			}
		}
//}}}
//{{{ Style Mode
		else if(this.currentMode=="Style Mode") {
			switch(true) {
				case (event.which==62): //">"
					if(!commands.selector) {
						commands.selector=">";
					} else if(commands.selector==">") {
						for(var i=0;i<this.instance.rows[this.currentRow].cells.length-1;i++) {
							this.larger(this.instance.rows[this.currentRow].cells[i]);
						}
						commands.reset();
					} else {
						commands.reset();
					}
					break;
				case (event.which==119): //"w"
					if(commands.selector) {
						switch(commands.selector) {
							case '>':
								for(var i=0;i<commands.getQuantifier();i++) {
									this.delByWord();
								}
								break;
							default:;
						}
						commands.reset();
					} else {
						for(var i=0;i<Number(commands.getQuantifier());i++) {
							this.forwardByWord();
						}
						commands.reset();
					}
					break;
				default:;
			}
		}
//}}}
//{{{ Replace Mode
		else if(this.currentMode=="Replace Mode") {
			switch(true) {
				case (event.which==9): //"Tab"
					this.input(event.shiftKey,event.which);
					break;
				case (event.which==13): //"Enter"
					 this.cmdEva(cmdline);
					 this.currentMode="Command Mode";
					 document.getElementById('mode').innerHTML=vim.currentMode;
					 break;
				case (event.which>15&&event.which<19): //"Shift,Ctrl,Alt"
					 break;
				default:
					 this.input(event.which);
			}
		}
//}}}
	}
//{{{ flash
	function flash(cell) {
		if(cell.className) {
			cell.className="";
		}
		else {
			cell.className="flash";
		}
		timer=setTimeout(function(){flash(cell);},600);
	}
//}}}
//{{{ stopflash
	this.stopFlash=function() {
		clearTimeout(timer);
		this.instance.rows[this.currentRow].cells[this.currentCol].className="";
	}
//}}}
//{{{ caret movement control
	this.moveCaret=function(x,y,move2end) {
		//stop flash
		clearTimeout(timer);
		try {
			this.instance.rows[this.currentRow].cells[this.currentCol].className="";
		}
		catch(err) {}

		if(this.currentRow+y<0) {
			this.currentRow=0;
		} else if(this.currentRow+y>this.instance.rows.length-1) {
			this.currentRow=this.instance.rows.length-1;
		} else {
			this.currentRow+=y;
		}

		if(this.currentCol+x<0) {
			this.currentCol=0;
		} else if(this.currentCol+x>=this.instance.rows[this.currentRow].cells.length-1) {
			if(move2end) {
				this.currentCol=this.instance.rows[this.currentRow].cells.length-1;
			} else if(this.instance.rows[this.currentRow].cells.length>1) { //if there are more than one cell
				this.currentCol=this.instance.rows[this.currentRow].cells.length-2;
			} else { //only one cell
				this.currentCol=0;
			}
		} else {
			this.currentCol+=x;
		}
		document.getElementById("debug").innerHTML=this.currentCol+","+this.currentRow;
		flash(this.instance.rows[this.currentRow].cells[this.currentCol]);
	}
//}}}
//{{{ text select control
	function selectText(x,y,tbody) {
		//stop flash
		clearTimeout(timer);
		try {
			tbody.rows[this.currentRow].cells[this.currentCol].className="";
		}
		catch(err) {}

		if(this.currentRow+y<0) {
			this.currentRow=0;
		}
		else if(this.currentRow+y>tbody.rows.length-1) {
			this.currentRow=tbody.rows.length-1;
		}
		else {
			this.currentRow+=y;
		}

		if(this.currentCol+x<0) {
			this.currentCol=0;
		}
		else if(vim.currentMode=="Insert Mode"&&this.currentCol+x==tbody.rows[this.currentRow].cells.length-1) {
			this.currentCol=tbody.rows[this.currentRow].cells.length-1;
		}
		else if(this.currentCol+x>tbody.rows[this.currentRow].cells.length-2) {
			if(tbody.rows[this.currentRow].cells.length>1) {
				this.currentCol=tbody.rows[this.currentRow].cells.length-2;
			}
			else {
				this.currentCol=0;
			}
		}
		else {
			this.currentCol+=x;
		}
		document.getElementById("debug").innerHTML=this.currentCol+","+this.currentRow;
		tbody.rows[this.currentRow].cells[this.currentCol].className="flash";
		flash(tbody.rows[this.currentRow].cells[this.currentCol]);
	}
//}}}
//{{{ forwardByWord : forward one word
	this.forwardByWord=function() {
		try { //<mark>
		while(/\w/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) { //Find the first none-word character 
			if(this.instance.rows[this.currentRow].cells[this.currentCol].nextSibling.nextSibling) {
				this.moveCaret(1,0,false)
			} else if(this.instance.rows[this.currentRow+1]) {
				this.moveCaret(-this.currentCol,1,false);
				if(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue!=" ") {break;} //if the char of next line isn't whitespace, then find
			} else {
				break;
			}
		}
		} catch(err) {this.moveCaret(0,1,false);}
		while(/\W/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) { //Find the first word character
			if(this.instance.rows[this.currentRow].cells[this.currentCol].nextSibling.nextSibling) {
				this.moveCaret(1,0,false);
			} else if(this.instance.rows[this.currentRow+1]) {
				this.moveCaret(-this.currentCol,1,false);
			} else {
				break;
			}
		}
	}
//}}}
//{{{ backwardByWord : backward one word
	this.backwardByWord=function() {
		if(this.currentCol==0) { //at row begin
			if(this.currentRow!=0) {
				this.moveCaret(this.instance.rows[this.currentRow-1].cells.length-1,-1,false);
			}
		} else {
			this.moveCaret(-1,0,false);
		}
		while(/\W/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) { //Find the first word character 
			if(this.instance.rows[this.currentRow].cells[this.currentCol].previousSibling) {
				this.moveCaret(-1,0,false);
			} else if(this.instance.rows[this.currentRow-1]) {
				this.moveCaret(this.instance.rows[this.currentRow-1].cells.length-this.currentCol-2,-1,false);
				if(/\w/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) {break;}
			}
		}
		while(this.instance.rows[this.currentRow].cells[this.currentCol].previousSibling&&/\w/.test(this.instance.rows[this.currentRow].cells[this.currentCol-1].firstChild.nodeValue)) { //Find the first whitespace
			if(this.instance.rows[this.currentRow].cells[this.currentCol-1]) {
				this.moveCaret(-1,0,false);
			} else {
				break;
			}
		}
	}
//}}}
//{{{ map key press to character
	function mapKeyPressToActualCharacter(isShiftKey, characterCode) {
		if(characterCode==9) {
			return "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		}
	        if (typeof isShiftKey != "boolean" || typeof characterCode != "number") {
			return false;
		}
		var characterMap = [];
		characterMap[192] = new Array("`","~");
		characterMap[49] = new Array("1","!");
		characterMap[50] = new Array("2","@");
		characterMap[51] = new Array("3","#");
		characterMap[52] = new Array("4","$");
		characterMap[53] = new Array("5","%");
		characterMap[54] = new Array("6","^");
		characterMap[55] = new Array("7","&");
		characterMap[56] = new Array("8","*");
		characterMap[57] = new Array("9","(");
		characterMap[48] = new Array("0",")");
		characterMap[189] = new Array("-","_");
		characterMap[187] = new Array("=","+");
		characterMap[219] = new Array("[","{");
		characterMap[221] = new Array("]","}");
		characterMap[220] = new Array("\\","|");
		characterMap[186] = new Array(";",":");
		characterMap[222] = new Array("'","\"");
		characterMap[188] = new Array(",","<");
		characterMap[190] = new Array(".",">");
		characterMap[191] = new Array("/","?");
		characterMap[32] = new Array(" "," ");
		var character = "";
		if (isShiftKey) {
			if ( characterCode >= 65 && characterCode <= 90 ) {
				character = String.fromCharCode(characterCode);
			} else {
				character = characterMap[characterCode][1];
			}
		} else {
			if(characterCode>=65&&characterCode<=90) {
				character = String.fromCharCode(characterCode).toLowerCase();
			} else {
				character = characterMap[characterCode][0];
			}
		}
		return character;
	}
//}}}
}
//{{{ delByWord : delete one word
Vim.prototype.delByWord=function() {
	if(/\w/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) { //if first char is word character
		while(!this.instance.rows[this.currentRow].cells[this.currentCol].hasAttribute("END")&&/\w/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) {
			this.instance.rows[this.currentRow].removeChild(this.instance.rows[this.currentRow].cells[this.currentCol]);
		}
	}
	while(!this.instance.rows[this.currentRow].cells[this.currentCol].hasAttribute("END")&&/\W/.test(this.instance.rows[this.currentRow].cells[this.currentCol].firstChild.nodeValue)) {
		this.instance.rows[this.currentRow].removeChild(this.instance.rows[this.currentRow].cells[this.currentCol]);
	}
	this.moveCaret(0,0,false);
}
//}}}
//{{{ delRow() - delete current row
Vim.prototype.delRow=function(row) {
	return(this.instance.removeChild(this.instance.rows[row]));
}
//}}}
//{{{ cmdline evaluator
Vim.prototype.cmdEva=function(cmd) {
	var eva=cmd.split(" ");
	switch(true) {
		case (eva[0]==":o"&&eva.length==1): //<test>
				this.fileHandle="open";
				this.upload="on";
				document.getElementById('file').focus();
				document.getElementById('notice').innerHTML="Press 'Enter' to open file.";
				document.getElementById('notice-wrap').style.top="0px";
				break;
		case (eva[0]==":w"&&eva.length==1):
				alert(this.write(0,0,this.instance.rows.length-1,this.instance.lastChild.cells.length-2));
				break;
		case (eva[0]==":q"):
				break;
		case (eva[0]==":help"&&eva.length==1):
				break;
		case (eva[0]==":date"&&eva.length==1): //insert current date
				//<mark>
				break;
		case (eva[0]==":r"&&eva.length==1):
				this.fileHandle="read";
				document.getElementById('file').focus();
				break;
		case (eva[0]==":set"):
				if(eva[1]=="number") { //experimental
					var ul=document.createElement("ul");
					ul.className="number";
					for(var i=0;i<this.instance.rows.length;i++) {
						var li=document.createElement("li");
						li.innerHTML=i+1;
						li.style.height=getComputedStyle(this.instance.rows[i],'height');
						ul.appendChild(li);
					}
					document.body.insertBefore(ul,this.instance.parentNode);
					ul=null;
					li=null;
				} else if(0) {
				}
				break;
		case (eva[0]==":sample"&&eva.length==1):
				this.moveCaret(1,0,true);
				this.read("Cell type:\nCell generation:\nCell confluence:\n\nSample 1:\nSample 2:\nSample 3:\n");
				break;
		case (eva[0]==":write"):
				alert(this.write(Number(eva[1]),Number(eva[2]),Number(eva[3]),Number(eva[4])));
				break;
		default:;
	}
}
//}}}
//{{{ style
vim.prototype.styleByWord=function(func) {
}
Vim.prototype.color=function(cell,color) {
	cell.style.color=color;
}
Vim.prototype.larger=function(cell) {
	var oriSize=parseInt(window.getComputedStyle(cell,null).fontSize);		
	oriSize+=2;
	cell.style.fontSize=oriSize+"px";
}
Vim.prototype.smaller=function(cell) {
	var oriSize=parseInt(window.getComputedStyle(cell,null).fontSize);		
	oriSize-=2;
	cell.style.fontSize=oriSize+"px";
}
Vim.prototype.bold=function(cell) {
}
//}}}
//{{{ scroll
Vim.prototype.scrollDown=function() {
	var h=Number(window.innerHeight);
	var p=findPos(this.instance.rows[this.currentRow]);
	var s= p[1] - (h-51);
	if(s>Number(window.scrollY)) {
		window.scrollTo(0,s);
	}
}
Vim.prototype.scrollUp=function() {
	var h=Number(window.innerHeight);
	var p=findPos(this.instance.rows[this.currentRow]);
	var s= p[1]-51;
	if(s<Number(window.scrollY)) {
		window.scrollTo(0,s);
	}
}
//}}}
//{{{ read() - read strings
Vim.prototype.read=function(string) {
	if(typeof string!="string") {
		alert("Not String");
		return;
	} else { //this section is too verbose
		var refRow=this.instance.rows[this.currentRow]; //all insertion accurs at this row;
		var refCell=this.instance.rows[this.currentRow].cells[this.currentCol]; //all insertion accurs before refCell
		this.stopFlash();
		if(this.instance.rows.length==this.currentRow-1) {  //check if at the end row
			var isEndRow=true;
		} else {var isEndRow=false;}

		for(var i=0;i<string.length;i++) {
			var character=string.substr(i,1);
			if(character=='\n') {
				//create new row
				var td=document.createElement('td');
				td.setAttribute('END','');
				var tr=document.createElement('tr');
				tr.appendChild(td);
				if(isEndRow) {
				this.instance.appendChild(tr);
				} else {
					this.instance.insertBefore(tr,refRow.nextSibling);
				}
				refRow=tr; //set refRow to new row
				//add left string to new row
				if(refCell.hasAttribute("END")) { //if at last cell
					refCell=td;
				} else {
					while(!refCell.nextSibling.hasAttribute("END")) {
						tr.insertBefore(refCell.nextSibling,td);
					}
					tr.insertBefore(refCell,tr.childNodes[0]);
				}
			} else {
				var td=document.createElement("td");
				td.appendChild(document.createTextNode(character));
				refRow.insertBefore(td,refCell);
			}
		}
		this.moveCaret(0,0,false);
		refCell=null;
		td=null;
	}
}
//}}}
//{{{ write() - write to strings by row and col position
Vim.prototype.write=function(y1,x1,y2,x2) {  //y=row x=col
	var text="";
	if(typeof x1!="number"||typeof x2!="number"||typeof y1!="number"||typeof y2!="number") {
		alert("Invalid range!");
		return 0;
	}
	if(y1==y2) {
		for(var i=0;i+x1<=x2;i++) {
			text+=this.instance.rows[y1].cells[i+x1].firstChild.nodeValue;
		}
	} else {
		for(var i=0;i+x1<this.instance.rows[y1].cells.length-1;i++) {
			text+=this.instance.rows[y1].cells[i+x1].firstChild.nodeValue;
		}
		text+='\n';
		for(var i=1;i+y1<y2;i++) {
			for(var j=0;j<this.instance.rows[i+y1].cells.length-1;j++) {
				text+=this.instance.rows[i+y1].cells[j].firstChild.nodeValue;
			}
			text+='\n';
		}
		for(var i=0;i<=x2;i++) {
			text+=this.instance.rows[y2].cells[i].firstChild.nodeValue;
		}
	}
	return text;
}
//{{{ some global functions
function findPos(obj) {
	var curleft=curtop=0;
	if(obj.offsetParent) {
		do {
			curleft+=obj.offsetLeft;
			curtop+=obj.offsetTop;
		} while(obj=obj.offsetParent);
		return [curleft,curtop];
	}
}
//}}}
