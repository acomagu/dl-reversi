'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function () {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();a = s.createElement(o), m = s.getElementsByTagName(o)[0];a.async = 1;a.src = g;m.parentNode.insertBefore(a, m);
  })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
  ga('create', 'UA-42893688-6', 'auto');
  ga('send', 'pageview');
})();

jQuery.noConflict();

var APIKEY = 'yBRLWcVu3x21fniEh8IcS3hypeQ5BkT96rmFh3Wz';

var CELLCOLOR = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2
};

var PLAYER = {
  HUMAN: 0,
  COMPUTER: 1
};

var GAMESTATE = {
  PROGRESS: 0,
  END: 1
};

var FACE = ['(*´∀｀*) .｡oO（', '(#ﾟДﾟ)', '(*ﾉД`*)･ﾟ･。', '(ﾉω･､)', '(･ω･｀*)', '(’ω’)', '(。>ω<。)', '((о(｡•ω•｡)о))', '(*　・´　∀・｀*)'];

// (Consider about introducing Immutable-js
var clone = function clone(object) {
  return jQuery.extend(true, Array.isArray(object) ? [] : {}, object);
};

var CSSTransitionGroup = React.addons.CSSTransitionGroup;

var Cell = (function (_React$Component) {
  _inherits(Cell, _React$Component);

  function Cell() {
    _classCallCheck(this, Cell);

    _get(Object.getPrototypeOf(Cell.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Cell, [{
    key: 'handleCellClicked',
    value: function handleCellClicked() {
      this.props.onCellClick(this.props.row, this.props.col);
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement('div', { className: [this.props.color == CELLCOLOR.EMPTY ? 'empty' : this.props.color == CELLCOLOR.WHITE ? 'white' : 'black', 'field-cell'].join(' '), onClick: this.handleCellClicked.bind(this), keys: this.props.color });
    }
  }]);

  return Cell;
})(React.Component);

var GameField = (function (_React$Component2) {
  _inherits(GameField, _React$Component2);

  _createClass(GameField, [{
    key: 'getInitialFieldColors',
    value: function getInitialFieldColors() {
      var fieldColors = [];
      for (var i = 0; i < 8; ++i) {
        var cols = [];
        for (var j = 0; j < 8; ++j) {
          cols.push(0);
        }fieldColors.push(cols);
      }
      fieldColors[3][3] = fieldColors[4][4] = CELLCOLOR.WHITE;
      fieldColors[3][4] = fieldColors[4][3] = CELLCOLOR.BLACK;
      return fieldColors;
    }
  }]);

  function GameField(props) {
    _classCallCheck(this, GameField);

    _get(Object.getPrototypeOf(GameField.prototype), 'constructor', this).call(this, props);
    this.computerChoicedAzureMLTypeFieldColors = this.humanChoicedAzureMLTypeFieldColors = [];
    this.state = {
      fieldColors: this.getInitialFieldColors(),
      turn: PLAYER.HUMAN,
      gameState: GAMESTATE.PROGRESS
    };
  }

  _createClass(GameField, [{
    key: 'getChangedFieldColors',
    value: function getChangedFieldColors(originalFieldColors, y, x, placedColor) {
      var dx = [1, 1, 1, 0, 0, -1, -1, -1];
      var dy = [1, 0, -1, 1, -1, 1, 0, -1];
      var fieldColors = clone(originalFieldColors);

      var _loop = function (i) {
        var toggleColors = function toggleColors(y, x) {
          if (y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
            return false;
          } else if (fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
            return true;
          } else {
            var chain = toggleColors(y + dy[i], x + dx[i]);
            if (chain) fieldColors[y + dy[i]][x + dx[i]] = placedColor;
            return chain;
          }
        };
        toggleColors(y, x);
      };

      for (var i = 0; i < 8; ++i) {
        _loop(i);
      }
      fieldColors[y][x] = placedColor;
      return fieldColors;
    }
  }, {
    key: 'isPlaceable',
    value: function isPlaceable(fieldColors, y, x, placedColor) {
      if (fieldColors[y][x] != CELLCOLOR.EMPTY) return false;
      var dx = [1, 1, 1, 0, 0, -1, -1, -1];
      var dy = [1, 0, -1, 1, -1, 1, 0, -1];
      var ans = false;

      var _loop2 = function (i) {
        var reg = function reg(_x4, _x5, _x6) {
          var _again2 = true;

          _function2: while (_again2) {
            var y = _x4,
                x = _x5,
                depth = _x6;
            _again2 = false;

            if (y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
              return false;
            } else if (depth >= 1 && fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
              return true;
            } else if (fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
              return false;
            } else {
              _x4 = y + dy[i];
              _x5 = x + dx[i];
              _x6 = depth + 1;
              _again2 = true;
              continue _function2;
            }
          }
        };
        ans |= reg(y, x, 0);
      };

      for (var i = 0; i < 8; ++i) {
        _loop2(i);
      }
      return ans;
    }
  }, {
    key: 'getAzureMLTypeFieldColors',
    value: function getAzureMLTypeFieldColors(fieldColors) {
      var flatArray = [];
      fieldColors.forEach(function (row) {
        flatArray = flatArray.concat(row.map(function (num) {
          return num.toString();
        }));
      });
      return flatArray;
    }
  }, {
    key: 'fetchMLResults',
    value: function fetchMLResults(fieldColorss) {
      // TODO: solve security problem (Is CORS Control unsafe?)
      var APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/';
      var self = this;
      var postData = {
        Inputs: {
          input1: {
            ColumnNames: (function () {
              return Array(64).fill().map(function (v, i) {
                return 'Cell' + Math.floor(i / 8) + i % 8;
              });
            })().concat(['Result']),
            Values: fieldColorss.map(function (fieldColors) {
              return self.getAzureMLTypeFieldColors(fieldColors).concat(['0']);
            })
          }
        },
        GlobalParameters: {}
      };
      var postBody = JSON.stringify({
        data: postData
      });
      return fetch(APIURL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': APIKEY
        },
        body: postBody
      }).then(function (response) {
        return response.json();
      }).then(function (obj) {
        return Promise.resolve(obj['Results']['output1']['value']['Values'].map(function (value) {
          return {
            scoredLabel: Number(value[1]),
            scoredProbability: Number(value[2])
          };
        }));
      });
    }
  }, {
    key: 'getPosition',
    value: function getPosition(y, x) {
      return {
        y: y,
        x: x
      };
    }
  }, {
    key: 'getPlaceablePositions',
    value: function getPlaceablePositions(fieldColors, placedColor) {
      var ans = [];
      for (var y = 0; y < 8; ++y) {
        for (var x = 0; x < 8; ++x) {
          if (this.isPlaceable(fieldColors, y, x, placedColor)) {
            ans.push(this.getPosition(y, x));
          }
        }
      }return ans;
    }
  }, {
    key: 'place',
    value: function place(y, x) {
      var player = this.state.turn;
      var placedColor = this.getPlacedColor(player);
      var changedFieldColors = this.getChangedFieldColors(this.state.fieldColors, y, x, placedColor);
      this.setState({
        fieldColors: changedFieldColors
      });
      var self = this;
      // ( bad parts
      this.forceUpdate(function () {
        var gameState = self.getGameState(self.state.fieldColors);
        if (gameState == GAMESTATE.PROGRESS) {
          self.changeTurnTo(player == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER);
        } else {
          var winner = self.getWinner(self.state.fieldColors);
          self.props.onAlert('' + (winner == PLAYER.HUMAN ? 'You WIN!' : winner == PLAYER.COMPUTER ? 'I WIN!' : 'DROW...'), winner != null ? winner : PLAYER.COMPUTER);
          self.sendTrainData(winner);
          self.setState({
            gameState: gameState
          });
        }
      });
    }
  }, {
    key: 'pass',
    value: function pass() {
      var _this = this;

      this.props.onAlert('PASS!', this.state.turn);
      var self = this;
      // ( BAD PART
      this.forceUpdate(function () {
        self.changeTurnTo(_this.state.turn == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER);
      });
    }
  }, {
    key: 'handleCellClicked',
    value: function handleCellClicked(y, x) {
      if (this.state.turn == PLAYER.HUMAN && this.isPlaceable(this.state.fieldColors, y, x, this.getPlacedColor(PLAYER.HUMAN))) {
        this.place(y, x);
      }
    }
  }, {
    key: 'changeTurnTo',
    value: function changeTurnTo(turn) {
      if (this.state.turn == turn) return;
      this.setState({
        turn: turn
      });
      if (turn == PLAYER.HUMAN) {
        this.handleturnChangeToHuman();
      } else {
        this.handleturnChangeToComputer();
      }
    }
  }, {
    key: 'getGameState',
    value: function getGameState(fieldColors) {
      var sumOfPlaceablePositions = this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.BLACK).length + this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.WHITE).length;
      if (sumOfPlaceablePositions == 0) {
        return GAMESTATE.END;
      } else {
        return GAMESTATE.PROGRESS;
      }
    }
  }, {
    key: 'getWinner',
    value: function getWinner(fieldColors) {
      var numbersOfBW = [CELLCOLOR.BLACK, CELLCOLOR.WHITE].map(function (color) {
        return fieldColors.map(function (value) {
          return value.filter(function (n) {
            return n == color;
          }).length;
        }).reduce(function (prev, current) {
          return prev + current;
        });
      });
      if (numbersOfBW[0] == numbersOfBW[1]) {
        return null;
      } else {
        return this.getPlayer(numbersOfBW[0] > numbersOfBW[1] ? CELLCOLOR.BLACK : CELLCOLOR.WHITE);
      }
    }
  }, {
    key: 'getPlacedColor',
    value: function getPlacedColor(turn) {
      return turn == PLAYER.HUMAN ? CELLCOLOR.WHITE : CELLCOLOR.BLACK;
    }
  }, {
    key: 'getPlayer',
    value: function getPlayer(color) {
      return color == CELLCOLOR.WHITE ? PLAYER.HUMAN : PLAYER.COMPUTER;
    }
  }, {
    key: 'handleturnChangeToHuman',
    value: function handleturnChangeToHuman() {
      this.computerChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
      if (this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)).length == 0) this.pass();
    }
  }, {
    key: 'getConfidenceLevel',
    value: function getConfidenceLevel(computerWinProbability) {
      return computerWinProbability < -(3 / 4) ? 1 : computerWinProbability < -(2 / 4) ? 2 : computerWinProbability < -(1 / 4) ? 3 : computerWinProbability < 0 ? 4 : computerWinProbability < 1 / 4 ? 5 : computerWinProbability < 2 / 4 ? 6 : computerWinProbability < 3 / 4 ? 7 : 8;
    }
  }, {
    key: 'handleturnChangeToComputer',
    value: function handleturnChangeToComputer() {
      this.props.onUpdateMLConfidenceLevel(0);
      this.humanChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
      var placedColor = this.getPlacedColor(PLAYER.COMPUTER);
      var placeablePositions = this.getPlaceablePositions(this.state.fieldColors, placedColor);
      if (placeablePositions.length == 0) {
        this.pass();
        return;
      }
      var self = this;
      this.fetchMLResults(placeablePositions.map(function (position) {
        return self.getChangedFieldColors(self.state.fieldColors, position.y, position.x, placedColor);
      })).then(function (results) {
        var computerWinProbabilities = results.map(function (value) {
          return Number(value.scoredProbability) * (value.scoredLabel == '1' ? 1 : -1);
        });
        // setting new field has max computerWinProbability
        var maxComputerWinProbability = Math.max.apply(null, computerWinProbabilities);
        var computerPlacePosition = placeablePositions[computerWinProbabilities.indexOf(maxComputerWinProbability)];
        console.log(maxComputerWinProbability);
        self.props.onUpdateMLConfidenceLevel(self.getConfidenceLevel(maxComputerWinProbability));
        self.place(computerPlacePosition.y, computerPlacePosition.x);
        // regist changes
      });
    }
  }, {
    key: 'sendTrainData',
    value: function sendTrainData(winner) {
      var APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/train-data';
      var postBody = this.computerChoicedAzureMLTypeFieldColors.map(function (value) {
        return value.concat([winner == PLAYER.COMPUTER ? '1' : '0']);
      }).concat(this.humanChoicedAzureMLTypeFieldColors.map(function (value) {
        return value.map(function (n) {
          return n == '1' ? '2' : n == '2' ? '1' : '0';
        }).concat([winner == PLAYER.HUMAN ? '1' : '0']);
      }));
      fetch(APIURL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': APIKEY
        },
        body: JSON.stringify(postBody)
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var rows = [];
      for (var i = 0; i < 8; ++i) {
        var cols = [];
        for (var j = 0; j < 8; ++j) {
          cols.push(React.createElement(
            'td',
            null,
            React.createElement(Cell, { row: i, col: j, color: this.state.fieldColors[i][j], onCellClick: this.handleCellClicked.bind(this) })
          ));
        }
        rows.push(React.createElement(
          'tr',
          null,
          cols
        ));
        this.rows = rows;
      }
      return React.createElement(
        'div',
        { className: 'gameField' },
        React.createElement(
          'table',
          null,
          rows
        )
      );
    }
  }]);

  return GameField;
})(React.Component);

var documentReadyPromise = new Promise(function (resolve, reject) {
  if (document.readyState == 'complete') resolve();
  document.addEventListener('DOMContentLoaded', function () {
    resolve();
  });
});

var MessageWindow = (function (_React$Component3) {
  _inherits(MessageWindow, _React$Component3);

  function MessageWindow() {
    _classCallCheck(this, MessageWindow);

    _get(Object.getPrototypeOf(MessageWindow.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MessageWindow, [{
    key: 'render',
    value: function render() {
      var messageLayerElement = React.createElement(
        'div',
        { className: 'message-layer', key: this.props.message },
        React.createElement(
          'div',
          { className: ['message-text-box'].concat(this.props.saidPlayer == PLAYER.HUMAN ? ['said-human'] : ['said-computer']).join(' ') },
          React.createElement(
            'span',
            { className: 'message-face' },
            FACE[this.props.MLConfidenceLevel]
          ),
          React.createElement(
            'span',
            { className: 'message-text' },
            this.props.message
          )
        )
      );
      var contentElement = this.props.hidden ? null : messageLayerElement;
      return React.createElement(
        'div',
        null,
        React.createElement(
          CSSTransitionGroup,
          { transitionName: 'message-layer-transition' },
          contentElement
        )
      );
    }
  }]);

  return MessageWindow;
})(React.Component);

var MLFace = (function (_React$Component4) {
  _inherits(MLFace, _React$Component4);

  function MLFace() {
    _classCallCheck(this, MLFace);

    _get(Object.getPrototypeOf(MLFace.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MLFace, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'mlface-box' },
        React.createElement(
          'span',
          { className: 'mlface' },
          FACE[this.props.MLConfidenceLevel]
        )
      );
    }
  }]);

  return MLFace;
})(React.Component);

var GameContainer = (function (_React$Component5) {
  _inherits(GameContainer, _React$Component5);

  function GameContainer(props) {
    _classCallCheck(this, GameContainer);

    _get(Object.getPrototypeOf(GameContainer.prototype), 'constructor', this).call(this, props);
    this.state = {
      isMessageWindowHidden: true,
      alertMessage: '',
      alertMessageSaidPlayer: PLAYER.COMPUTER,
      MLConfidenceLevel: 0
    };
  }

  _createClass(GameContainer, [{
    key: 'handleAlert',
    value: function handleAlert(message, saidPlayer) {
      this.setState({
        alertMessage: message,
        alertMessageSaidPlayer: saidPlayer,
        isMessageWindowHidden: false,
        MLConfidenceLevel: 0
      });
      var self = this;
      setTimeout(function () {
        self.setState({
          isMessageWindowHidden: true
        });
      }, 3000);
    }
  }, {
    key: 'handleUpdateMLConfidenceLevel',
    value: function handleUpdateMLConfidenceLevel(MLConfidenceLevel) {
      this.setState({
        MLConfidenceLevel: MLConfidenceLevel
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'game-container' },
        React.createElement(MLFace, { MLConfidenceLevel: this.state.MLConfidenceLevel }),
        React.createElement(GameField, { onAlert: this.handleAlert.bind(this), onUpdateMLConfidenceLevel: this.handleUpdateMLConfidenceLevel.bind(this) }),
        React.createElement(MessageWindow, { message: this.state.alertMessage, saidPlayer: this.state.alertMessageSaidPlayer, MLConfidenceLevel: this.state.MLConfidenceLevel, hidden: this.state.isMessageWindowHidden })
      );
    }
  }]);

  return GameContainer;
})(React.Component);

documentReadyPromise.then(function () {
  React.render(React.createElement(GameContainer, null), document.querySelector('.game'));
});