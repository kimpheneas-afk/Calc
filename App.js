const ComponentFunction = function() {
  const React = require('react');
  const { useState, useEffect, useContext, useMemo, useCallback } = React;
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView, FlatList } = require('react-native');
  const { MaterialIcons } = require('@expo/vector-icons');
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  
  const storageStrategy = 'local';
  const primaryColor = '#3B82F6';
  const accentColor = '#1D4ED8';
  const backgroundColor = '#F9FAFB';
  const cardColor = '#FFFFFF';
  const textPrimary = '#111827';
  const textSecondary = '#6B7280';
  const designStyle = 'modern';
  
  const Tab = createBottomTabNavigator();
  
  const ThemeContext = React.createContext();
  const ThemeProvider = function(props) {
    const [darkMode, setDarkMode] = useState(false);
    const lightTheme = useMemo(function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: backgroundColor,
          card: cardColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
          border: '#E5E7EB',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    }, []);
    const darkTheme = useMemo(function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: '#1F2937',
          card: '#374151',
          textPrimary: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#4B5563',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    }, []);
    const theme = darkMode ? darkTheme : lightTheme;
    const toggleDarkMode = useCallback(function() {
      setDarkMode(function(prev) { return !prev; });
    }, []);
    const value = useMemo(function() {
      return { theme: theme, darkMode: darkMode, toggleDarkMode: toggleDarkMode, designStyle: designStyle };
    }, [theme, darkMode, toggleDarkMode]);
    return React.createElement(ThemeContext.Provider, { value: value }, props.children);
  };
  const useTheme = function() { return useContext(ThemeContext); };

  const CalculatorContext = React.createContext();
  const CalculatorProvider = function(props) {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [history, setHistory] = useState([]);
    const [precision, setPrecision] = useState(6);
    const [isRadians, setIsRadians] = useState(true);

    const addToHistory = useCallback(function(expr, result) {
      const historyItem = {
        id: Date.now().toString(),
        expression: expr,
        result: result,
        timestamp: new Date().toLocaleString()
      };
      setHistory(function(prev) {
        return [historyItem].concat(prev.slice(0, 19));
      });
    }, []);

    const clearHistory = useCallback(function() {
      setHistory([]);
    }, []);

    const evaluateExpression = useCallback(function(expr) {
      try {
        let processedExpr = expr
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/×/g, '*')
          .replace(/÷/g, '/');

        if (!isRadians) {
          processedExpr = processedExpr
            .replace(/Math\.sin\(/g, 'Math.sin(Math.PI/180*')
            .replace(/Math\.cos\(/g, 'Math.cos(Math.PI/180*')
            .replace(/Math\.tan\(/g, 'Math.tan(Math.PI/180*');
          const openParens = (processedExpr.match(/Math\.(sin|cos|tan)\(Math\.PI\/180\*/g) || []).length;
          for (let i = 0; i < openParens; i++) {
            processedExpr += ')';
          }
        }

        const result = eval(processedExpr);
        if (isNaN(result) || !isFinite(result)) {
          throw new Error('Invalid calculation');
        }
        return Number(result.toFixed(precision));
      } catch (error) {
        throw new Error('Error');
      }
    }, [precision, isRadians]);

    const calculate = useCallback(function() {
      if (expression) {
        try {
          const result = evaluateExpression(expression);
          const resultStr = result.toString();
          setDisplay(resultStr);
          addToHistory(expression, resultStr);
          setExpression(resultStr);
        } catch (error) {
          setDisplay('Error');
          setExpression('');
        }
      }
    }, [expression, evaluateExpression, addToHistory]);

    const clear = useCallback(function() {
      setDisplay('0');
      setExpression('');
    }, []);

    const deleteLast = useCallback(function() {
      if (expression.length > 0) {
        const newExpr = expression.slice(0, -1);
        setExpression(newExpr);
        setDisplay(newExpr || '0');
      }
    }, [expression]);

    const appendToExpression = useCallback(function(value) {
      if (display === 'Error') {
        clear();
      }
      const newExpr = expression === '0' ? value : expression + value;
      setExpression(newExpr);
      setDisplay(newExpr);
    }, [expression, display, clear]);

    const value = useMemo(function() {
      return {
        display: display,
        expression: expression,
        history: history,
        precision: precision,
        isRadians: isRadians,
        setPrecision: setPrecision,
        setIsRadians: setIsRadians,
        calculate: calculate,
        clear: clear,
        deleteLast: deleteLast,
        appendToExpression: appendToExpression,
        clearHistory: clearHistory,
        addToHistory: addToHistory
      };
    }, [display, expression, history, precision, isRadians, calculate, clear, deleteLast, appendToExpression, clearHistory, addToHistory]);

    return React.createElement(CalculatorContext.Provider, { value: value }, props.children);
  };

  const useCalculator = function() { return useContext(CalculatorContext); };

  const CalculatorScreen = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const calculator = useCalculator();

    const buttons = [
      [
        { label: 'C', type: 'function', action: calculator.clear },
        { label: '⌫', type: 'function', action: calculator.deleteLast },
        { label: '(', type: 'operator', value: '(' },
        { label: ')', type: 'operator', value: ')' }
      ],
      [
        { label: 'sin', type: 'scientific', value: 'sin(' },
        { label: 'cos', type: 'scientific', value: 'cos(' },
        { label: 'tan', type: 'scientific', value: 'tan(' },
        { label: '÷', type: 'operator', value: '÷' }
      ],
      [
        { label: 'log', type: 'scientific', value: 'log(' },
        { label: 'ln', type: 'scientific', value: 'ln(' },
        { label: '√', type: 'scientific', value: 'sqrt(' },
        { label: '×', type: 'operator', value: '×' }
      ],
      [
        { label: 'π', type: 'constant', value: 'π' },
        { label: 'e', type: 'constant', value: 'e' },
        { label: '^', type: 'operator', value: '^' },
        { label: '-', type: 'operator', value: '-' }
      ],
      [
        { label: '7', type: 'number', value: '7' },
        { label: '8', type: 'number', value: '8' },
        { label: '9', type: 'number', value: '9' },
        { label: '+', type: 'operator', value: '+' }
      ],
      [
        { label: '4', type: 'number', value: '4' },
        { label: '5', type: 'number', value: '5' },
        { label: '6', type: 'number', value: '6' },
        { label: '=', type: 'equals', action: calculator.calculate, rowSpan: 2 }
      ],
      [
        { label: '1', type: 'number', value: '1' },
        { label: '2', type: 'number', value: '2' },
        { label: '3', type: 'number', value: '3' }
      ],
      [
        { label: '0', type: 'number', value: '0', colSpan: 2 },
        { label: '.', type: 'number', value: '.' }
      ]
    ];

    const renderButton = function(button, rowIndex, colIndex) {
      const isEquals = button.type === 'equals';
      const isZero = button.label === '0';
      
      const buttonStyle = [
        styles.button,
        { backgroundColor: theme.colors.card },
        button.type === 'number' && { backgroundColor: theme.colors.background },
        button.type === 'operator' && { backgroundColor: theme.colors.primary },
        button.type === 'scientific' && { backgroundColor: theme.colors.accent },
        button.type === 'function' && { backgroundColor: theme.colors.error },
        button.type === 'equals' && { backgroundColor: theme.colors.success },
        isEquals && styles.equalsButton,
        isZero && styles.zeroButton
      ];

      const textStyle = [
        styles.buttonText,
        { color: theme.colors.textPrimary },
        (button.type === 'operator' || button.type === 'scientific' || button.type === 'function' || button.type === 'equals') && { color: '#FFFFFF' }
      ];

      const handlePress = function() {
        if (button.action) {
          button.action();
        } else if (button.value) {
          calculator.appendToExpression(button.value);
        }
      };

      return React.createElement(TouchableOpacity, {
        key: colIndex,
        style: buttonStyle,
        onPress: handlePress,
        componentId: 'calculator-button-' + button.label.replace(/[^a-zA-Z0-9]/g, '')
      }, 
        React.createElement(Text, { style: textStyle }, button.label)
      );
    };

    return React.createElement(View, { 
      style: [styles.container, { backgroundColor: theme.colors.background }],
      componentId: 'calculator-screen'
    },
      React.createElement(StatusBar, { 
        barStyle: themeContext.darkMode ? 'light-content' : 'dark-content',
        backgroundColor: theme.colors.background
      }),
      React.createElement(View, { 
        style: [styles.displayContainer, { backgroundColor: theme.colors.card }],
        componentId: 'calculator-display-container'
      },
        React.createElement(Text, { 
          style: [styles.displayText, { color: theme.colors.textPrimary }],
          numberOfLines: 3,
          componentId: 'calculator-display-text'
        }, calculator.display)
      ),
      React.createElement(View, { 
        style: styles.buttonContainer,
        componentId: 'calculator-button-container'
      }, 
        buttons.map(function(row, rowIndex) {
          return React.createElement(View, { 
            key: rowIndex, 
            style: styles.buttonRow,
            componentId: 'calculator-button-row-' + rowIndex
          }, 
            row.map(function(button, colIndex) {
              return renderButton(button, rowIndex, colIndex);
            })
          );
        })
      )
    );
  };

  const HistoryScreen = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const calculator = useCalculator();

    const handleHistoryItemPress = function(item) {
      calculator.appendToExpression(item.expression);
    };

    const handleClearHistory = function() {
      if (Platform.OS === 'web') {
        if (window.confirm('Clear all history?')) {
          calculator.clearHistory();
        }
      } else {
        Alert.alert(
          'Clear History',
          'Are you sure you want to clear all history?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', onPress: calculator.clearHistory }
          ]
        );
      }
    };

    const handleDownloadHistory = function() {
      if (calculator.history.length === 0) {
        if (Platform.OS === 'web') {
          window.alert('No history to download');
        } else {
          Alert.alert('No History', 'There are no calculations to download');
        }
        return;
      }

      if (Platform.OS === 'web') {
        try {
          const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
            'Expression,Result,Timestamp\n' +
            calculator.history.map(function(item) {
              return '"' + item.expression + '","' + item.result + '","' + item.timestamp + '"';
            }).join('\n')
          );
          
          const link = document.createElement('a');
          link.setAttribute('href', csvContent);
          link.setAttribute('download', 'calculator-history-' + new Date().getTime() + '.csv');
          link.click();

          if (Platform.OS === 'web') {
            window.alert('History downloaded successfully!');
          }
        } catch (error) {
          if (Platform.OS === 'web') {
            window.alert('Failed to download history');
          } else {
            Alert.alert('Error', 'Failed to download history');
          }
        }
      } else {
        const historyText = calculator.history.map(function(item) {
          return item.expression + ' = ' + item.result + ' (' + item.timestamp + ')';
        }).join('\n');
        
        Alert.alert('History Download', 'Copy this history:\n\n' + historyText.substring(0, 500) + (historyText.length > 500 ? '...' : ''));
      }
    };

    const renderHistoryItem = function(item, index) {
      return React.createElement(TouchableOpacity, {
        key: item.id,
        style: [styles.historyItem, { 
          backgroundColor: theme.colors.card,
          borderBottomColor: theme.colors.border
        }],
        onPress: function() { handleHistoryItemPress(item); },
        componentId: 'history-item-' + index
      },
        React.createElement(View, { style: styles.historyContent },
          React.createElement(Text, { 
            style: [styles.historyExpression, { color: theme.colors.textSecondary }],
            componentId: 'history-expression-' + index
          }, item.expression),
          React.createElement(Text, { 
            style: [styles.historyResult, { color: theme.colors.textPrimary }],
            componentId: 'history-result-' + index
          }, '= ' + item.result),
          React.createElement(Text, { 
            style: [styles.historyTime, { color: theme.colors.textSecondary }],
            componentId: 'history-time-' + index
          }, item.timestamp)
        )
      );
    };

    return React.createElement(View, { 
      style: [styles.container, { backgroundColor: theme.colors.background }],
      componentId: 'history-screen'
    },
      React.createElement(View, { 
        style: [styles.headerContainer, { backgroundColor: theme.colors.card }],
        componentId: 'history-header'
      },
        React.createElement(Text, { 
          style: [styles.headerTitle, { color: theme.colors.textPrimary }],
          componentId: 'history-title'
        }, 'Calculation History'),
        React.createElement(View, { style: styles.headerButtonsGroup, componentId: 'history-buttons-group' },
          calculator.history.length > 0 && React.createElement(TouchableOpacity, {
            style: [styles.downloadButton, { backgroundColor: theme.colors.primary }],
            onPress: handleDownloadHistory,
            componentId: 'history-download-button'
          },
            React.createElement(MaterialIcons, { 
              name: 'download', 
              size: 18, 
              color: '#FFFFFF',
              componentId: 'history-download-icon'
            }),
            React.createElement(Text, { 
              style: [styles.downloadButtonText, { color: '#FFFFFF' }],
              componentId: 'history-download-text'
            }, 'Download')
          ),
          calculator.history.length > 0 && React.createElement(TouchableOpacity, {
            style: [styles.clearButton, { backgroundColor: theme.colors.error }],
            onPress: handleClearHistory,
            componentId: 'history-clear-button'
          },
            React.createElement(Text, { 
              style: [styles.clearButtonText, { color: '#FFFFFF' }],
              componentId: 'history-clear-text'
            }, 'Clear')
          )
        )
      ),
      calculator.history.length === 0 ? 
        React.createElement(View, { 
          style: styles.emptyContainer,
          componentId: 'history-empty'
        },
          React.createElement(MaterialIcons, { 
            name: 'history', 
            size: 64, 
            color: theme.colors.textSecondary,
            componentId: 'history-empty-icon'
          }),
          React.createElement(Text, { 
            style: [styles.emptyText, { color: theme.colors.textSecondary }],
            componentId: 'history-empty-text'
          }, 'No calculations yet')
        ) :
        React.createElement(ScrollView, { 
          style: styles.historyList,
          contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
          componentId: 'history-scroll'
        },
          calculator.history.map(function(item, index) {
            return renderHistoryItem(item, index);
          })
        )
    );
  };

  const SettingsScreen = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const calculator = useCalculator();

    const handlePrecisionChange = function(newPrecision) {
      calculator.setPrecision(newPrecision);
    };

    const handleAngleUnitToggle = function() {
      calculator.setIsRadians(function(prev) { return !prev; });
    };

    const precisionOptions = [2, 4, 6, 8, 10];

    return React.createElement(View, { 
      style: [styles.container, { backgroundColor: theme.colors.background }],
      componentId: 'settings-screen'
    },
      React.createElement(ScrollView, { 
        style: styles.settingsContainer,
        contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
        componentId: 'settings-scroll'
      },
        React.createElement(Text, { 
          style: [styles.settingsTitle, { color: theme.colors.textPrimary }],
          componentId: 'settings-title'
        }, 'Settings'),
        
        React.createElement(View, { 
          style: [styles.settingCard, { backgroundColor: theme.colors.card }],
          componentId: 'theme-setting-card'
        },
          React.createElement(View, { style: styles.settingHeader },
            React.createElement(MaterialIcons, { 
              name: 'palette', 
              size: 24, 
              color: theme.colors.primary,
              componentId: 'theme-icon'
            }),
            React.createElement(Text, { 
              style: [styles.settingTitle, { color: theme.colors.textPrimary }],
              componentId: 'theme-setting-title'
            }, 'Appearance')
          ),
          React.createElement(TouchableOpacity, { 
            style: [styles.settingOption, { borderBottomColor: theme.colors.border }],
            onPress: themeContext.toggleDarkMode,
            componentId: 'theme-toggle-button'
          },
            React.createElement(Text, { 
              style: [styles.settingOptionText, { color: theme.colors.textPrimary }],
              componentId: 'theme-toggle-text'
            }, 'Dark Mode'),
            React.createElement(View, { 
              style: [styles.toggle, themeContext.darkMode && { backgroundColor: theme.colors.primary }],
              componentId: 'theme-toggle-indicator'
            },
              React.createElement(View, { 
                style: [styles.toggleDot, themeContext.darkMode && styles.toggleDotActive],
                componentId: 'theme-toggle-dot'
              })
            )
          )
        ),

        React.createElement(View, { 
          style: [styles.settingCard, { backgroundColor: theme.colors.card }],
          componentId: 'precision-setting-card'
        },
          React.createElement(View, { style: styles.settingHeader },
            React.createElement(MaterialIcons, { 
              name: 'format-list-numbered', 
              size: 24, 
              color: theme.colors.primary,
              componentId: 'precision-icon'
            }),
            React.createElement(Text, { 
              style: [styles.settingTitle, { color: theme.colors.textPrimary }],
              componentId: 'precision-setting-title'
            }, 'Decimal Precision')
          ),
          precisionOptions.map(function(option, index) {
            return React.createElement(TouchableOpacity, { 
              key: option,
              style: [
                styles.settingOption, 
                { borderBottomColor: theme.colors.border },
                index === precisionOptions.length - 1 && { borderBottomWidth: 0 }
              ],
              onPress: function() { handlePrecisionChange(option); },
              componentId: 'precision-option-' + option
            },
              React.createElement(Text, { 
                style: [styles.settingOptionText, { color: theme.colors.textPrimary }],
                componentId: 'precision-option-text-' + option
              }, option + ' decimal places'),
              calculator.precision === option && React.createElement(MaterialIcons, { 
                name: 'check', 
                size: 20, 
                color: theme.colors.primary,
                componentId: 'precision-check-' + option
              })
            );
          })
        ),

        React.createElement(View, { 
          style: [styles.settingCard, { backgroundColor: theme.colors.card }],
          componentId: 'angle-setting-card'
        },
          React.createElement(View, { style: styles.settingHeader },
            React.createElement(MaterialIcons, { 
              name: 'rotate-right', 
              size: 24, 
              color: theme.colors.primary,
              componentId: 'angle-icon'
            }),
            React.createElement(Text, { 
              style: [styles.settingTitle, { color: theme.colors.textPrimary }],
              componentId: 'angle-setting-title'
            }, 'Angle Unit')
          ),
          React.createElement(TouchableOpacity, { 
            style: [styles.settingOption, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }],
            onPress: function() { calculator.setIsRadians(true); },
            componentId: 'angle-radians-option'
          },
            React.createElement(Text, { 
              style: [styles.settingOptionText, { color: theme.colors.textPrimary }],
              componentId: 'angle-radians-text'
            }, 'Radians'),
            calculator.isRadians && React.createElement(MaterialIcons, { 
              name: 'check', 
              size: 20, 
              color: theme.colors.primary,
              componentId: 'angle-radians-check'
            })
          ),
          React.createElement(TouchableOpacity, { 
            style: [styles.settingOption, { borderBottomWidth: 0 }],
            onPress: function() { calculator.setIsRadians(false); },
            componentId: 'angle-degrees-option'
          },
            React.createElement(Text, { 
              style: [styles.settingOptionText, { color: theme.colors.textPrimary }],
              componentId: 'angle-degrees-text'
            }, 'Degrees'),
            !calculator.isRadians && React.createElement(MaterialIcons, { 
              name: 'check', 
              size: 20, 
              color: theme.colors.primary,
              componentId: 'angle-degrees-check'
            })
          )
        )
      )
    );
  };

  const TabNavigator = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;

    return React.createElement(View, { 
      style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' },
      componentId: 'tab-navigator-wrapper'
    },
      React.createElement(Tab.Navigator, {
        screenOptions: function(props) {
          return {
            headerShown: false,
            tabBarStyle: {
              position: 'absolute',
              bottom: 0,
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              height: Platform.OS === 'web' ? 80 : 90,
              paddingBottom: Platform.OS === 'ios' ? 20 : 10,
              paddingTop: 10
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarLabelStyle: {
              fontSize: 12,
              marginTop: 4
            }
          };
        },
        componentId: 'tab-navigator'
      },
        React.createElement(Tab.Screen, {
          name: 'Calculator',
          component: CalculatorScreen,
          options: {
            tabBarIcon: function(props) {
              return React.createElement(MaterialIcons, {
                name: 'calculate',
                size: 24,
                color: props.color,
                componentId: 'calculator-tab-icon'
              });
            }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'History',
          component: HistoryScreen,
          options: {
            tabBarIcon: function(props) {
              return React.createElement(MaterialIcons, {
                name: 'history',
                size: 24,
                color: props.color,
                componentId: 'history-tab-icon'
              });
            }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Settings',
          component: SettingsScreen,
          options: {
            tabBarIcon: function(props) {
              return React.createElement(MaterialIcons, {
                name: 'settings',
                size: 24,
                color: props.color,
                componentId: 'settings-tab-icon'
              });
            }
          }
        })
      )
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: '100%'
    },
    displayContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      padding: 24,
      margin: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
    },
    displayText: {
      fontSize: 36,
      fontWeight: '300',
      textAlign: 'right',
      minHeight: 48
    },
    buttonContainer: {
      padding: 16,
      paddingBottom: Platform.OS === 'web' ? 90 : 100
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    button: {
      flex: 1,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    },
    equalsButton: {
      position: 'absolute',
      right: 4,
      height: 140,
      top: 0
    },
    zeroButton: {
      flex: 2,
      marginRight: 8
    },
    buttonText: {
      fontSize: 20,
      fontWeight: '600'
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB'
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold'
    },
    headerButtonsGroup: {
      flexDirection: 'row',
      gap: 8
    },
    clearButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600'
    },
    downloadButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center'
    },
    downloadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100
    },
    emptyText: {
      fontSize: 18,
      marginTop: 16,
      textAlign: 'center'
    },
    historyList: {
      flex: 1
    },
    historyItem: {
      padding: 20,
      borderBottomWidth: 1
    },
    historyContent: {
      flex: 1
    },
    historyExpression: {
      fontSize: 16,
      marginBottom: 4
    },
    historyResult: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8
    },
    historyTime: {
      fontSize: 12
    },
    settingsContainer: {
      flex: 1,
      padding: 20
    },
    settingsTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 24
    },
    settingCard: {
      borderRadius: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
    },
    settingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 12
    },
    settingTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 12
    },
    settingOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1
    },
    settingOptionText: {
      fontSize: 16
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      paddingHorizontal: 2
    },
    toggleDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2
    },
    toggleDotActive: {
      marginLeft: 20
    }
  });

  return React.createElement(ThemeProvider, null,
    React.createElement(CalculatorProvider, null,
      React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' } },
        React.createElement(StatusBar, { barStyle: 'dark-content' }),
        React.createElement(TabNavigator)
      )
    )
  );
};
return ComponentFunction;
