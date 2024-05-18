local WeaveValue = {}
local RunService = game:GetService("RunService")

local CLASS_METATABLE = {__index = WeaveValue}
local WEAK_KEYS_METATABLE = {__mode = "k"}
local Fusion = require(script.Parent.Parent.Fusion)
local WeaveUtils = require(script.Parent.WeaveUtils)

local Value = Fusion.Value

function WeaveValue:getNow()
	return self._value
end

function WeaveValue:get()
	return self._fusionValue:get()
end

function WeaveValue:getValue()
	return self._fusionValue
end

function WeaveValue:set(newValue: any, force: boolean?)
	assert(
		typeof(newValue) == typeof(self._fusionValue:get()),
		`Expected type {typeof(self._fusionValue:get())}, got {newValue} of type {typeof(newValue)}`
	)
	
	self._value = newValue
	self._fusionValue:set(newValue, force)
	self:_UpdateValueInWorkspace()
end

function WeaveValue:_UpdateValueInWorkspace()
	self._parentInstance.Value = self._value
end

function WeaveValue:GetNewInstance(name: string, initialValue: any)
	local newInstance
	local valueType = typeof(initialValue)
	if valueType == "table" then
		error(`Value type of {valueType} is not supported. Use WeaveObject or WeaveList`)
	elseif valueType == "string" then
		newInstance = Instance.new("StringValue")
	elseif valueType == "boolean" then
		newInstance = Instance.new("BoolValue")
	elseif valueType == "number" then
		newInstance = Instance.new("IntValue")
	end
	newInstance.Name = name
	newInstance.Parent = WeaveUtils.GetWeaveFolder()
	newInstance.Value = initialValue
	return newInstance
end

function WeaveValue:_GetValueFromInstance(instance: Instance)
	if instance:IsA("StringValue") or instance:IsA("BoolValue") or instance:IsA("IntValue") then
		return instance.Value
	end
	return nil
end

function WeaveValue:_RemoveValueFor(player: Player)
	if self._playerValues:get()[player] == nil then return end
	
	local playerValues = self._playerValues:get()
	playerValues[player] = nil
	self._playerValues:set(playerValues)
end

function WeaveValue:_AttachListenersToInstance()
	self._parentInstance:GetPropertyChangedSignal("Value"):Connect(function()
			self:set(self._parentInstance.Value)
	end)
	return nil
end


function WeaveValue:_SetUpValue()
	if RunService:IsServer() then
		local newInstance = WeaveValue:GetNewInstance(self._name, self._fusionValue:get())
		if newInstance == nil then
			error("Unsupported data type for WeaveValue")
		end
		self._parentInstance = newInstance
	else
		local workspaceFolder = WeaveUtils.GetWeaveFolder()
		self._parentInstance = workspaceFolder:WaitForChild(self._name, 60)
		
		if self._parentInstance == nil then
			error(`Couldn't find value instance for {self._name}`)
		end
		self._value = self:_GetValueFromInstance(self._parentInstance)
		self._fusionValue = Value(self._value)
		self:_AttachListenersToInstance()
	end
end

function WeaveValue<T>(initialName: string, initialValue: T?)
	
	if initialValue == nil then
		initialValue = 0
	end
	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_name = initialName,
		_value = initialValue,
		_fusionValue = Value(initialValue),
	}, CLASS_METATABLE)
	
	self:_SetUpValue()
	if RunService:IsClient() then
		return self:getValue()
	end
	return self
end

return WeaveValue
