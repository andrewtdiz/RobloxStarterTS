local PlayerValue = {}
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local CLASS_METATABLE = { __index = PlayerValue }
local WEAK_KEYS_METATABLE = { __mode = "k" }
local Fusion = require(script.Parent.Parent.Fusion)
local WeaveUtils = require(script.Parent.WeaveUtils)
local Trove = require(script.Parent.Parent.Trove)

local Value = Fusion.Value

function PlayerValue:getNow()
	if RunService:IsClient() then
		error("Cannot use getNow on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value
end

function PlayerValue:getNowFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getNowFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value[player]
end

function PlayerValue:getFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._fusionValue:get()[player]
end

function PlayerValue:Fusion()
	return self._fusionValue
end

function PlayerValue:setFor(player: Player, newValue: any, force: boolean)
	if RunService:IsClient() then
		error("Cannot set PlayerValue value on the client. Only the Server")
		return
	end

	local fusionValue = self._fusionValue:get()
	fusionValue[player] = newValue
	self._fusionValue:set(fusionValue, force)

	self:_UpdatePlayerGuiValue(player, self._instances[player], newValue)

	for _, middleware in self._middlewares do
		middleware(player, newValue)
	end
end

function PlayerValue:set(newValue: any, force: boolean?)
	assert(
		typeof(newValue) == typeof(self._fusionValue:get()),
		`Expected type {typeof(self._fusionValue:get())}, got {newValue} of type {typeof(newValue)}`
	)

	self._value = newValue
	self._fusionValue:set(self._value, force)
end

function PlayerValue:updateFor(player: Player, func: (t: any) -> nil, force: boolean)
	if RunService:IsClient() then
		error("Cannot set PlayerValue value on the client. Only the Server")
		return
	end

	local fusionValue = self._fusionValue:get()
	local currentValue = fusionValue[player]

	if typeof(currentValue) == "table" then
		func(currentValue)
	else
		currentValue = func(currentValue)
	end

	fusionValue[player] = currentValue
	self._fusionValue:set(fusionValue, force)

	self:_UpdatePlayerGuiValue(player, self._instances[player], currentValue)

	for _, middleware in self._middlewares do
		middleware(player, currentValue)
	end
end

function PlayerValue:_PlayerAdded(player: Player)
	if not RunService:IsServer() then
		return
	end
	local PlayerGui = player:WaitForChild("PlayerGui")

	assert(PlayerGui:FindFirstChild(self._name) == nil, `Instance already created for {self._name}`)

	local fusionValue = self._fusionValue:get()
	fusionValue[player] = self._value
	self._fusionValue:set(fusionValue)

	local instance = WeaveUtils.GetNewInstance(self._name, self._value, PlayerGui)

	self._instances[player] = instance
end

function PlayerValue:_PlayerRemoving(player: Player)
	if not RunService:IsServer() then
		return
	end

	local fusionValue = self._fusionValue:get()
	fusionValue[player] = nil
	self._fusionValue:set(fusionValue)

	self._instances[player] = nil
end

function PlayerValue:_UpdatePlayerGuiValue(player: Player, parentInstance: Instance, valueObject)
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
		self:_UpdatePlayerGuiValue(player, valueInstance, valueObject[key])
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

function PlayerValue:_Reload()
	if RunService:IsServer() then
		return
	end

	self:set(WeaveUtils.GetValueFromInstance(self._parentInstance))
end

function PlayerValue:_AttachListenersToInstance(instance: Instance)
	if RunService:IsServer() then
		return
	end

	if instance:IsA("StringValue") or instance:IsA("BoolValue") or instance:IsA("NumberValue") then
		self._troves[instance] = Trove.new()
		self._troves[instance]:AttachToInstance(instance)
		self._troves[instance]:Connect(instance:GetPropertyChangedSignal("Value"), function()
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
	self._troves[instance]:Connect(instance.ChildAdded, function(child)
		self:_Reload()
		self:_AttachListenersToInstance(child)
	end)
	self._troves[instance]:Connect(instance.ChildRemoved, function(child)
		if self._troves[child] ~= nil then
			self._troves[child]:Destroy()
			self._troves[child] = nil
		end
		self:_Reload()
	end)
	return nil
end

function PlayerValue:_SetUpValue()
	if RunService:IsClient() then
		local LocalPlayer = Players.LocalPlayer
		local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")
		self._parentInstance = PlayerGui:WaitForChild(self._name, 5)

		if self._parentInstance == nil then
			error(`Couldn't find value instance for {self._name}`)
		end

		self._value = WeaveUtils.GetValueFromInstance(self._parentInstance)
		self._fusionValue = Value(self._value)
		self:_AttachListenersToInstance(self._parentInstance)
	end
end

function PlayerValue<T>(valueName: string, initialValue: T?, middlewares: { any })
	local parentInstance = nil
	if initialValue == nil then
		initialValue = {}

		if RunService:IsClient() then
			local LocalPlayer = Players.LocalPlayer
			local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")
			parentInstance = PlayerGui:WaitForChild(valueName, 5)

			if parentInstance == nil then
				error(`Couldn't find value instance for {valueName}`)
			end
			initialValue = WeaveUtils.GetValueFromInstance(parentInstance)
		end
	end

	if middlewares ~= nil then
		for _, middleware in middlewares do
			assert(typeof(middleware) == "function", `Middleware {middleware} is not a function`)
		end
	else
		middlewares = {}
	end

	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_name = valueName,
		_middlewares = middlewares,
		_value = initialValue,
		_fusionValue = Value({}),
		_instances = {},
		_troves = {},
	}, CLASS_METATABLE)

	self:_SetUpValue()

	if RunService:IsClient() then
		return self._fusionValue
	else
		for _, player in Players:GetPlayers() do
			self:_PlayerAdded(player)
		end
		Players.PlayerAdded:Connect(function(player)
			self:_PlayerAdded(player)
		end)
		Players.PlayerRemoving:Connect(function(player)
			self:_PlayerRemoving(player)
		end)
	end
	return self
end

return PlayerValue
