import ast, sys, json

"""
Jsvee Python transpiler
(C) Teemu Sirkia, 2016
Licensed under MIT License.
"""

class ParseResult:
    def __init__(self):
        self.steps = []
        self.initSteps = []
        self.positionStack = ['0']
        self.line = 0
        self.labelCounter = 0
        self.iteratorCounter = 0
        self.breakStack = []
        self.functions = []
        self.classes = []
        self.classesWithInit = []
        self.firstLine = True

    def checkLine(self, line):
        if line != self.line:
            if self.firstLine:
                self.initSteps.append(['setLine', line])
                self.firstLine = False
            else:
                self.steps.append(['setLine', line])
            self.line = line

    def getNextIterator(self):
        self.iteratorCounter += 1
        return 'i' + str(self.iteratorCounter)

    def getNextLabel(self):
        self.labelCounter += 1
        return 'l' + str(self.labelCounter)

    def moveRight(self):
        parts = self.positionStack[-1].split('/')
        parts[-1] = str(int(parts[-1]) + 1)
        self.positionStack[-1] = '/'.join(parts)

    def moveLeft(self):
        parts = self.positionStack[-1].split('/')
        parts[-1] = str(int(parts[-1]) - 1)
        self.positionStack[-1] = '/'.join(parts)

    def moveParentRight(self):
        parts = self.positionStack[-1].split('/')
        parts[-2] = str(int(parts[-2]) + 1)
        self.positionStack[-1] = '/'.join(parts)

    def moveDown(self):
        self.positionStack.append(self.positionStack[-1] + '/0/0')

    def moveUp(self):
        self.positionStack.pop()

    def getPosition(self):
        return self.positionStack[-1]

    def resetPosition(self):
        self.positionStack = ['0']
        
    def addInitStep(self, step):
        stepAsString = '|'.join([str(x) for x in step])
        for s in self.initSteps:
            ss = '|'.join([str(x) for x in s])
            if ss == stepAsString:
                return
        self.initSteps.append(step)

# *********************************************************************************************************************

def handleAssign(node, line, result):
    result.checkLine(line)

    # TODO:
    assert len(node.targets) == 1
    name = node.targets[0].__class__.__name__
    target = node.targets[0]

    if name == 'Name':
        traverseCode(node.value, line, result)
        result.steps.append(['assign', node.targets[0].id])
        result.resetPosition()
    elif name == 'Subscript':
        assert len(target.slice._fields) == 1 and 'value' in target.slice._fields
        pos = result.getPosition()
        traverseCode(target.value, line, result)
        result.steps.append(['addOperator', '[]=', result.getPosition()])
        result.addInitStep(['createOperator', '[ ] =', 'pr', '', '[ # ] = #'])
        result.moveLeft()
        result.moveDown()
        result.moveParentRight()
        traverseCode(target.slice.value, line, result)
        result.moveLeft()
        result.moveParentRight()
        traverseCode(node.value, line, result)
        result.steps.append(['setValueAtIndex', pos])
        result.resetPosition()
    elif name == 'Attribute':
        traverseCode(node.value, line, result)
        assert node.targets[0].value.__class__.__name__ == 'Name'        
        result.steps.append(['assignField', node.targets[0].attr, '@' + node.targets[0].value.id])
        result.resetPosition()
    else:
        assert False

def handleAugAssign(node, line, result):
    assert node.target.__class__.__name__ == 'Name'
    
    result.checkLine(line)
    result.steps.append(['addValueFromVariable', node.target.id, result.getPosition()])
    result.moveRight()
    
    ops = {'Mult': '*', 'Add': '+', 'Sub': '-', 'Div': '/', 'Pow': '**'}
    name = node.op.__class__.__name__
    position = result.getPosition()

    if name in ops:
        result.steps.append(['addOperator', ops[name], position])
        result.addInitStep(['createOperator', ops[name], 'lr'])
        result.moveRight()
    else:
        sys.stderr.write('Warning: Unknown operator {}.\n'.format(name))

    traverseCode(node.value, line, result)
    result.steps.append(['evaluateOperator', position])    
    result.steps.append(['assign', node.target.id])  
    result.resetPosition()
    

def handleAttribute(node, line, result):
    
    #TODO: attribute chains
    type = name = node.value.__class__.__name__
    assert type == 'Name'
    
    result.steps.append(['addValueFromField', node.attr, '@' + node.value.id, result.getPosition()])
    result.moveRight()
    
def handleBinOp(node, line, result):
    ops = {'Mult': '*', 'Add': '+', 'Sub': '-', 'Div': '/', 'Pow': '**'}
    name = node.op.__class__.__name__

    traverseCode(node.left, line, result)
    position = result.getPosition()

    if name in ops:
        result.steps.append(['addOperator', ops[name], position])
        result.addInitStep(['createOperator', ops[name], 'lr'])
        result.moveRight()
    else:
        sys.stderr.write('Warning: Unknown operator {}.\n'.format(name))

    traverseCode(node.right, line, result)

    result.steps.append(['evaluateOperator', position])
    result.moveLeft()
    result.moveLeft()

def handleBoolOp(node, line, result):
    ops = {'And' : 'and', 'Or' : 'or'}
    name = node.op.__class__.__name__

    traverseCode(node.values[0], line, result)

    pos = result.getPosition()
    result.steps.append(['addOperator', ops[name], pos])
    result.addInitStep(['createOperator', ops[name], 'lr'])

    label1 = result.getNextLabel()
    label2 = result.getNextLabel()
    result.steps.append(['evaluateOperator', pos])
    result.steps.append(['_conditionalJump', '@' + label1, '@' + label2])

    result.steps.append(['_label', label1])
    result.steps.append(['removeElement_', label1])
    result.moveLeft()
    traverseCode(node.values[1], line, result)

    result.steps.append(['_label', label2])


def handleBreak(node, line, result):
    assert len(result.breakStack) > 0
    result.checkLine(line)
    label = result.breakStack[-1][1]
    result.steps.append(['goto', '@' + label])


def handleCall(node, line, result):
    result.checkLine(line)
    position = result.getPosition()
    
    name = node.func.__class__.__name__
    
    if name == 'Name':
        
        # Creating class instance or call function?
        if node.func.id not in result.classes:        
            if node.func.id not in result.functions:
                params = 'abcdefghijklmnopq'[0:len(node.args)]
                if node.func.id != 'print':
                    result.addInitStep(['createFunction', node.func.id, node.func.id + '(' + ', '.join(params) + ')', len(node.args), '-1'])
                else:
                    result.addInitStep(['createFunction', node.func.id, node.func.id + '(a, ...)', -1, '-1'])
            
            result.steps.append(['addFunction', node.func.id, position, len(node.args)])
            result.moveDown()
            for n in node.args:
                traverseCode(n, line, result)
                result.moveLeft()
                result.moveParentRight()
            result.moveUp()
            result.moveRight()
            result.steps.append(['evaluateFunction', position])
        else:
            result.steps.append(['createInstance', node.func.id])
            result.steps.append(['addReference', '-1', position])            
            if node.func.id in result.classesWithInit:
                result.steps.append(['addFunction', '__init__', position, len(node.args), '?'])
                result.moveDown()
                result.moveParentRight()
            for n in node.args:
                traverseCode(n, line, result)
                result.moveLeft()
                result.moveParentRight()
            result.moveUp()
            result.moveRight()
            result.steps.append(['evaluateFunction', position])
            
    elif name == 'Attribute':
        type = node.func.value.__class__.__name__
        assert type == 'Name'

        result.moveRight()
        position2 = result.getPosition()

        result.steps.append(['addValueFromVariable', node.func.value.id, position])
        result.steps.append(['addFunction', node.func.attr, position2, len(node.args), '?'])

        result.moveLeft()
        
        if node.func.attr == 'append' and 'list' in result.classes:
            result.initSteps.append(['createClass', 'list'])
            result.initSteps.append(['createFunction', 'append', 'append' + '(item)', '1', '-1', 'list'])
        
        result.moveDown()
        result.moveParentRight()
        for n in node.args:
            traverseCode(n, line, result)
            result.moveLeft()
            result.moveParentRight()
        result.moveUp()
        result.moveRight()
        result.steps.append(['evaluateFunction', position])
    else:
        assert False


def handleClassDef(node, line, result):
    # TODO:
    assert len(node.bases) == 0

    result.initSteps.append(['createClass', node.name])
    result.classes.append(node.name)
    for n in node.body:
        name = n.__class__.__name__
        if name == 'FunctionDef':
            if n.name == '__init__':
                result.classesWithInit.append(node.name)
            handleFunctionDef(n, line, result, node.name, n.name == '__init__')


def handleCompare(node, line, result):
    ops = {'Gt': '>', 'Lt': '<', 'GtE': '>=', 'LtE': '<=', 'In': 'in', 'NotIn': 'not in'}

    traverseCode(node.left, line, result)

    # TODO:
    assert len(node.comparators) == 1

    for i in range(len(node.comparators)):
        name = node.ops[i].__class__.__name__
        position = result.getPosition()
        if name in ops:
            result.steps.append(['addOperator', ops[name], position])
            result.addInitStep(['createOperator', ops[name], 'lr'])
            result.moveRight()
        else:
            sys.stderr.write('Warning: Unknown operator {}.\n'.format(name))


        traverseCode(node.comparators[i], line, result)
        result.steps.append(['evaluateOperator', position])
        result.moveLeft()
        result.moveLeft()


def handleContinue(node, line, result):
    assert len(result.breakStack) > 0
    result.checkLine(line)
    label = result.breakStack[-1][0]
    result.steps.append(['goto', '@' + label])

def handleDict(node, line, result):
    result.steps.append(['createInstance', 'dict'])

    # TODO:
    assert len(node.keys) == 0 and len(node.values) == 0

    pos = result.getPosition()
    result.steps.append(['addReference', '-1', pos])
    result.moveRight()


def handleExpr(node, line, result):
    result.checkLine(line)
    for node in ast.iter_child_nodes(node):
        traverseCode(node, line, result)
    result.resetPosition()


def handleFor(node, line, result):    
    
    #TODO: for x in range(3)
    assert node.iter.__class__.__name__ == 'Name' or (node.iter.__class__.__name__ == 'Call' and node.iter.func.id == 'range')
    assert node.target.__class__.__name__ == 'Name'

    rangeFor = False
    if node.iter.__class__.__name__ == 'Call' and node.iter.func.id == 'range':
        rangeFor = True
    

    result.checkLine(line)
        
    label1 = result.getNextLabel()
    label2 = result.getNextLabel()
    label3 = result.getNextLabel()
    label4 = result.getNextLabel()
    
    result.breakStack.append([label1, label3])
    
    iterator = result.getNextIterator()    
    result.checkLine(line)    
    
    if not rangeFor:
        result.steps.append(['_createIterator', iterator, '@' + node.iter.id])
    else:
        handleCall(node.iter, line, result)
        result.resetPosition()
        result.steps.append(['clearEvaluationArea_'])
        result.steps.append(['_createIterator', iterator, '-1'])
    
    result.steps.append(['_label', label1])
    result.steps.append(['_iterate', iterator, '@' + label2, '@' + label3])
    result.steps.append(['_label', label2])
    result.steps.append(['takeNext', iterator, result.getPosition()])
    result.steps.append(['assign', node.target.id])
    for n in node.body:
        traverseCode(n, line, result)
    result.steps.append(['setLine', line])
    result.steps.append(['goto', '@' + label1])

    result.steps.append(['_label', label3])
    for n in node.orelse:
        traverseCode(n, line, result)

    result.steps.append(['_label', label4])
    result.breakStack.pop()

def handleFunctionDef(node, line, result, className=None, isCtor=False):
    args = [x.arg for x in node.args.args]
    label = result.getNextLabel()
    label2 = result.getNextLabel()
    argCount = len(args)
    
    if className != None:
        argCount -= 1

    command = ['createFunction', node.name, node.name + '(' + ', '.join(args) + ')', argCount, '@' + label]
    if className != None:
        command.append(className)
    else:
        result.functions.append(node.name)
    result.initSteps.append(command)

    result.steps.append(['goto', '@' + label2])

    result.steps.append(['_label', label])
    result.checkLine(line)

    if len(args) > 0:
        result.steps.append(['createParameterVariables', args])
        result.steps.append(['assignParameters', args])

    for n in node.body:
        traverseCode(n, line, result)

    if result.steps[-1][0] != 'returnValue' and not isCtor:
        result.steps.append(['clearEvaluationArea'])
        result.resetPosition()
        result.steps.append(['addValue', 'None', '0', 'NoneType'])
        result.steps.append(['returnValue'])
    elif isCtor:
        result.steps.append(['clearEvaluationArea_', 'self', '0'])
        result.steps.append(['addValueFromVariable', 'self', '0'])
        result.steps.append(['returnValue'])

    result.steps.append(['_label', label2])


def handleIf(node, line, result):
    result.checkLine(line)

    label1 = result.getNextLabel()
    label2 = result.getNextLabel()
    label3 = result.getNextLabel()

    traverseCode(node.test, line, result)
    result.resetPosition()
    result.steps.append(['_conditionalJump', '@' + label1, '@' + label2])

    result.steps.append(['_label', label1])
    for n in node.body:
        traverseCode(n, line, result)
    result.steps.append(['goto', '@' + label3])

    result.steps.append(['_label', label2])
    for n in node.orelse:
        traverseCode(n, line, result)
    result.steps.append(['goto', '@' + label3])

    result.steps.append(['_label', label3])


def handleList(node, line, result, type='list'):
    result.steps.append(['createInstance', type])
    pos = result.getPosition()
    result.classes.append('list')
    
    if len(node.elts) > 0:
        result.steps.append(['addCollectionInitializer', '-1', pos, len(node.elts)])
        result.moveDown()
        result.moveParentRight()
        for n in node.elts:
            traverseCode(n, line, result)
            result.moveLeft()
            result.moveParentRight()
        result.moveUp()
        result.moveRight()
        result.steps.append(['initializeCollection', pos])
    else:
       result.steps.append(['addReference', '-1', pos])
       result.moveRight()


def handleName(node, line, result):
    # Python < 3.5
    if node.id == 'True':
        result.steps.append(['addValue', 'True', result.getPosition(), 'bool'])
    elif node.id == 'False':
        result.steps.append(['addValue', 'False', result.getPosition(), 'bool'])
    elif node.id == 'None':
        result.steps.append(['addValue', 'None', result.getPosition(), 'NoneType'])
    else:
        result.steps.append(['addValueFromVariable', node.id, result.getPosition()])
    result.moveRight()


def handleNameConstant(node, line, result):
    # Python >= 3.5
    if node.value == True:
        result.steps.append(['addValue', 'True', result.getPosition(), 'bool'])
    elif node.value == False:
        result.steps.append(['addValue', 'False', result.getPosition(), 'bool'])
    elif node.value == None:
        result.steps.append(['addValue', 'None', result.getPosition(), 'NoneType'])
    else:
        sys.stderr.write('NameConstant value ({}) not supported!\n'.format(node.value))
    result.moveRight()


def handleNum(node, line, result):
    result.steps.append(['addValue', str(node.n), result.getPosition(), node.n.__class__.__name__])
    result.moveRight()


def handlePass(node, line, result):
    pass


def handleReturn(node, line, result):
    result.checkLine(line)
    if node.value != None:
        traverseCode(node.value, line, result)
    else:
        result.steps.append(['addValue', 'None', result.getPosition(), 'NoneType'])

    result.steps.append(['returnValue'])
    result.resetPosition()


def handleSubscript(node, line, result):
    # TODO:
    assert len(node.slice._fields) == 1 and 'value' in node.slice._fields

    pos = result.getPosition()
    traverseCode(node.value, line, result)

    result.steps.append(['addOperator', '[ ]', result.getPosition()])
    result.addInitStep(['createOperator', '[ ]', 'pr', '', ' [ # ]'])
    result.moveLeft()
    result.moveDown()
    result.moveParentRight()
    traverseCode(node.slice.value, line, result)
    result.steps.append(['getValueAtIndex', pos])
    result.moveUp()
    result.moveRight()


def handleStr(node, line, result):
    result.steps.append(['addValue', node.s, result.getPosition(), 'str'])
    result.moveRight()


def handleTuple(node, line, result):
    handleList(node, line, result, 'tuple')


def handleUnaryOp(node, line, result):
    ops = {'Not': 'not'}
    name = node.op.__class__.__name__
    position = result.getPosition()

    if name == 'USub':
        result.steps.append(['addValue', '-' + str(node.operand.n), result.getPosition(), node.operand.n.__class__.__name__])
    elif name == 'UAdd':
        result.steps.append(['addValue', node.operand.n, result.getPosition(), node.operand.n.__class__.__name__])
    elif name in ops:
        result.steps.append(['addOperator', ops[name], position])
        result.addInitStep(['createOperator', ops[name], 'r'])
        result.moveRight()
        traverseCode(node.operand, line, result)
    else:
        sys.stderr.write('Warning: Unknown operator {}.\n'.format(name))

    result.steps.append(['evaluateOperator', position])
    result.moveLeft()


def handleWhile(node, line, result):
    label0 = result.getNextLabel()
    result.steps.append(['_label', label0])

    result.checkLine(line)

    label1 = result.getNextLabel()
    label2 = result.getNextLabel()
    label3 = result.getNextLabel()

    result.breakStack.append([label0, label3])

    traverseCode(node.test, line, result)
    result.resetPosition()
    result.steps.append(['_conditionalJump', '@' + label1, '@' + label2])

    result.steps.append(['_label', label1])
    for n in node.body:
        traverseCode(n, line, result)
    result.steps.append(['goto', '@' + label0])

    result.steps.append(['_label', label2])
    for n in node.orelse:
        traverseCode(n, line, result)

    result.steps.append(['_label', label3])
    result.breakStack.pop()

# *********************************************************************************************************************

def traverseCode(node, line, result):
    name = node.__class__.__name__
    if hasattr(node, 'lineno'):
        line = node.lineno

    if 'handle' + name in globals():
        globals()['handle' + name](node, line, result)
    else:
        sys.stderr.write('Warning: No handler for {}.\n'.format(name))


def main():
    
    code = """
max(5, abs(2*-3))
""".strip()

    tree = ast.parse(code)
    result = ParseResult()

    for node in ast.iter_child_nodes(tree):
        traverseCode(node, 0, result)

    result.initSteps.append(['createFrame'])
    resultJSON = {'lines':code.split('\n'), 'settings':{'code':'left', 'heapHeight':0, 'stackHeight': 250, 'width':800}, 'init': result.initSteps, 'steps': result.steps}
    print(json.dumps(resultJSON))

# *********************************************************************************************************************

if __name__ == '__main__':
    main()
