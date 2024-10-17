local Value = {}
local RunService = game:GetService("RunService")

local CLASS_METATABLE = { __index = Value }
local WEAK_KEYS_METATABLE = { __mode = "k" }
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Fusion =
	TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "fusion", "src")
local WeaveUtils = require(script.Parent.WeaveUtils)
local Trove = TS.import(
	script,
	game:GetService("ReplicatedStorage"),
	"rbxts_include",
	"node_modules",
	"@rbxts",
	"trove",
	"out"
).Trove

local FusionValue = Fusion.Value

function Value:getNow()
	return self._value
end

function Value:get()
	return self._fusionValue:get()
end

function Value:getValue()
	return self._fusionValue
end

function Value:Fusion()
	return self._fusionValue
end

function Value:set(newValue: any, force: boolean?)
	assert(
		typeof(newValue) == typeof(self._fusionValue:get()),
		`Expected type {typeof(self._fusionValue:get())}, got {newValue} of type {typeof(newValue)}`
	)

	self._value = newValue
	self._fusionValue:set(self._value, force)
	if RunService:IsServer() then
		self:UpdateGameWorkspace(self._parentInstance, self._fusionValue:get())
	end
end

function Value:update(func: (t: any) -> nil, force: boolean)
	if RunService:IsClient() then
		error("Cannot set WeavePlayerValue value on the client. Only the Server")
		return
	end

	local fusionValue = self._fusionValue:get()
	local newValue = func(fusionValue)
	self._value = newValue
	self._fusionValue:set(self._value, force)
	if RunService:IsServer() then
		self:UpdateGameWorkspace(self._parentInstance, self._fusionValue:get())
	end
end

function Value:UpdateGameWorkspace(parentInstance: Instance, valueObject)
	if typeof(valueObject) ~= "table" then
		if not WeaveUtils.IsCorrectInstanceType(valueObject, parentInstance) then
			error(`Setting incorrect value for instance type. {parentInstance}, {valueObject}`)
		end
		parentInstance.Value = valueObject
		return
	end

	if not WeaveUtils.IsCorrectInstanceType(valueObject, parentInstance) then
		parentInstance:SetAttribute("Type", WeaveUtils.TableType(valueObject))
	end

	for key, value in valueObject do
		local valueInstance
		if WeaveUtils.IsAPlayer(key) then
			valueInstance = parentInstance:FindFirstChild(`{key.UserId}`)
		else
			valueInstance = parentInstance:FindFirstChild(key)
		end

		if valueInstance == nil or not WeaveUtils.IsCorrectInstanceType(value, valueInstance) then
			if valueInstance ~= nil then
				valueInstance:Destroy()
			end
			valueInstance = WeaveUtils.GetNewInstance(key, value)
			valueInstance.Parent = parentInstance
		end
		self:UpdateGameWorkspace(valueInstance, valueObject[key])
	end

	if next(valueObject) == nil then
		for _, valueInstance in parentInstance:GetChildren() do
			valueInstance:Destroy()
		end
	else
		for _, valueInstance in parentInstance:GetChildren() do
			local tableType = WeaveUtils.TableType(valueObject)
			if tableType == "List" then
				local index = tonumber(valueInstance.Name)
				if index > #valueObject then
					valueInstance:Destroy()
				end
			elseif tableType == "Object" then
				local key = WeaveUtils.GetKeyNameFromInstance(valueInstance)
				if valueObject[key] == nil then
					valueInstance:Destroy()
				end
			end
		end
	end
end

function Value:_Reload()
	if RunService:IsServer() then
		return
	end

	self:set(WeaveUtils.GetValueFromInstance(self._parentInstance))
end

function Value:_AttachListenersToInstance(instance: Instance)
	if RunService:IsServer() then
		return
	end

	if instance:IsA("StringValue") or instance:IsA("BoolValue") or instance:IsA("NumberValue") then
		self._troves[instance] = Trove.new()
		self._troves[instance]:attachToInstance(instance)
		self._troves[instance]:connect(instance:GetPropertyChangedSignal("Value"), function()
			self:_Reload()
		end)
		return
	end

	if self._troves[instance] == nil then
		self._troves[instance] = Trove.new()
	end
	for _, valueInstance in instance:GetChildren() do
		self:_AttachListenersToInstance(valueInstance)
	end
	self._troves[instance]:connect(instance.ChildAdded, function(child)
		self:_Reload()
		self:_AttachListenersToInstance(child)
	end)
	self._troves[instance]:connect(instance.ChildRemoved, function(child)
		if self._troves[child] ~= nil then
			self._troves[child]:Destroy()
			self._troves[child] = nil
		end
		self:_Reload()
	end)
	return nil
end

function Value:_SetUpValue()
	if RunService:IsServer() then
		local newInstance = WeaveUtils.GetNewInstance(self._name, self._fusionValue:get())
		if newInstance == nil then
			error("Unsupported data type for Value")
		end
		self._parentInstance = newInstance
	else
		local workspaceFolder = WeaveUtils.GetWeaveFolder()
		self._parentInstance = workspaceFolder:WaitForChild(self._name, 60)

		if self._parentInstance == nil then
			error(`Couldn't find value instance for {self._name}`)
		end

		self._value = WeaveUtils.GetValueFromInstance(self._parentInstance)
		self._fusionValue = FusionValue(self._value)
		self:_AttachListenersToInstance(self._parentInstance)
	end
end

function Value<T>(initialName: string, initialValue: T?)
	if initialValue == nil then
		initialValue = {}
	end
	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_name = initialName,
		_value = initialValue,
		_fusionValue = FusionValue(initialValue),
		_troves = {},
	}, CLASS_METATABLE)

	self:_SetUpValue()

	if RunService:IsClient() then
		return self:getValue()
	end
	return self
end

return Value
