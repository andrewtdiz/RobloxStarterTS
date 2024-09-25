local ZapPlayerValue = {}
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local CLASS_METATABLE = {__index = ZapPlayerValue}
local WEAK_KEYS_METATABLE = {__mode = "k"}
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Fusion = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "fusion", "src")
local WeaveUtils = require(script.Parent.WeaveUtils)

local Value = Fusion.Value

function ZapPlayerValue:getNow()
	if RunService:IsClient() then
		error("Cannot use getNow on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value
end

function ZapPlayerValue:getNowFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getNowFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value[player]
end

function ZapPlayerValue:getFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._fusionValue:get()[player]
end

function ZapPlayerValue:Fusion()
	return self._fusionValue
end

function ZapPlayerValue:setFor(player: Player, newValue: any, force: boolean?)
	if RunService:IsClient() then
		error("Cannot set ZapPlayerValue value on the client. Only the Server")
		return
	end

	local fusionValue = self._fusionValue:get()
	fusionValue[player] = newValue
	self._fusionValue:set(fusionValue, force)
	self._value[player] = newValue
	self:_UpdateValueToClient(player, newValue)
end

function ZapPlayerValue:updateFor(player: Player, cb: (a: any) -> any, force: boolean?)
	if RunService:IsClient() then
		error("Cannot set ZapPlayerValue value on the client. Only the Server")
		return
	end

	local fusionValue = self._fusionValue:get()
	local currentValue = fusionValue[player]
	cb(currentValue)

	fusionValue[player] = currentValue
	self._fusionValue:set(fusionValue, force)
	self._value[player] = currentValue
	self:_UpdateValueToClient(player, currentValue)
end

function ZapPlayerValue:_UpdateValueToClient(player: Player, newValue: any)
	self._zapEvent.Fire(player, { value = newValue })
end

function ZapPlayerValue:_UpdateOnClient(newValue: any)
	self._playerValue:set(newValue)
end

function ZapPlayerValue:_PlayerAdded(player: Player)
	if not RunService:IsServer() then return end
	local fusionValue = self._fusionValue:get()
	fusionValue[player] = self._initialValue
	self._fusionValue:set(fusionValue)
end

function ZapPlayerValue:_PlayerRemoving(player: Player)
	if not RunService:IsServer() then return end
	task.wait(2)
	local fusionValue = self._fusionValue:get()
	fusionValue[player] = nil
	self._fusionValue:set(fusionValue)
end

function ZapPlayerValue:_SetUpValue()
	if RunService:IsServer() then
		local newInstance = WeaveUtils.GetNewInstance(self._name, self._initialValue)
		if newInstance == nil then
			error("Unsupported data type for WeaveValue")
		end
		self._parentInstance = newInstance
	end
end

local function GetZapModule()
	for _, child in game:GetService("ReplicatedStorage"):GetDescendants() do
		if RunService:IsClient() and child.Name == "ZapClient" and child:IsA("ModuleScript") then
			return child
		elseif RunService:IsServer() and child.Name == "ZapServer" and child:IsA("ModuleScript") then
			return child
		end
	end
	if RunService:IsClient() then
		error("Could not find ZapClient Module script. You sure it exists and is in ReplicatedStorage somewhere?")
	else
		error("Could not find ZapServer Module script. You sure it exists and is in ReplicatedStorage somewhere?")
	end
end

function ZapPlayerValue<T>(valueName: string, zapEventName: string, initialValue: T?)
	local parentInstance = nil
	if initialValue == nil then
		initialValue = {}
		
		if RunService:IsClient() then
			local workspaceFolder = WeaveUtils.GetWeaveFolder()
			parentInstance = workspaceFolder:WaitForChild(valueName, 60)

			if parentInstance == nil then
				error(`Couldn't find value instance for {valueName}`)
			end
			initialValue = WeaveUtils.GetValueFromInstance(parentInstance)
		end
	end
	
	local zapModule = require(GetZapModule())
	if not WeaveUtils.KeyExists(zapModule, zapEventName) then
		error(`{zapEventName} Event not found on zapModule. Ensure the zapModule Client and Server Implements the {zapEventName} Event`)
		return
	end
	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_initialValue = initialValue,
		_name = valueName,
		_value = {},
		_parentInstance = parentInstance,
		_fusionValue = Value({}),
		_playerValue = Value(initialValue),
		_zapEvent = zapModule[`{zapEventName}`],
		_troves = {}
	}, CLASS_METATABLE)

	self:_SetUpValue()

	if RunService:IsServer() then
		for _, player in Players:GetPlayers() do 
			self:_PlayerAdded(player)
		end
		Players.PlayerAdded:Connect(function(player)
			self:_PlayerAdded(player)
		end)
		Players.PlayerRemoving:Connect(function(player)
			self:_PlayerRemoving(player)
		end)
	else
		self._zapEvent.SetCallback(function(Data: { value: number })
			local newValue = Data.value
			self:_UpdateOnClient(newValue)
		end)
	end
	
	if RunService:IsClient() then
		return self._playerValue
	end
	return self
end


return ZapPlayerValue
