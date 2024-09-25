local ProfileServerValue = {}
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local CLASS_METATABLE = { __index = ProfileServerValue }
local WEAK_KEYS_METATABLE = { __mode = "k" }
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Fusion =
	TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "fusion", "src")
local WeaveUtils = require(script.Parent.WeaveUtils)

local Value = Fusion.Value

function ProfileServerValue:getNow()
	if RunService:IsClient() then
		error("Cannot use getNow on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value
end

function ProfileServerValue:getNowFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getNowFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._value[player]
end

function ProfileServerValue:getFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._fusionValue:get()[player]
end

function ProfileServerValue:Fusion()
	return self._fusionValue
end

function ProfileServerValue:setFor(player: Player, newValue: any, force: boolean?)
	if RunService:IsClient() then
		error("Cannot set ProfileServerValue value on the client. Only the Server")
		return
	end
	local fusionValue = self._fusionValue:get()
	fusionValue[player] = newValue
	self._fusionValue:set(fusionValue, force)
	self._value[player] = newValue
	task.spawn(function()
		self._dataHandler:Set(player, self._profileServiceKey, newValue)
	end)
end

function ProfileServerValue:updateFor(player: Player, cb: (a: any) -> any, force: boolean?)
	if RunService:IsClient() then
		error("Cannot set ProfileServerValue value on the client. Only the Server")
		return
	end
	local fusionValue = self._fusionValue:get()
	cb(fusionValue[player])

	local updatedValue = fusionValue[player]
	fusionValue[player] = updatedValue
	self._fusionValue:set(fusionValue, force)
	self._value[player] = updatedValue
	task.spawn(function()
		self._dataHandler:Set(player, self._profileServiceKey, updatedValue)
	end)
end

function ProfileServerValue:isLoaded(player)
	if RunService:IsClient() then
		error("Cannot get isLoaded ProfileServerValue value on the client. Only the Server")
		return false
	end
	return self._isLoaded[player]
end

function ProfileServerValue:_PlayerAdded(player: Player)
	if not RunService:IsServer() then
		return
	end
	self._isLoaded[player] = false
	local storedValue = self._dataHandler:GetAsync(player, self._profileServiceKey)
	self._isLoaded[player] = true
	local fusionValue = self._fusionValue:get()
	fusionValue[player] = storedValue
	self._fusionValue:set(fusionValue)
	self._value[player] = storedValue
end

function ProfileServerValue:_PlayerRemoving(player: Player)
	task.delay(2, function()
		self._isLoaded[player] = nil
		local fusionValue = self._fusionValue:get()
		fusionValue[player] = nil
		self._fusionValue:set(fusionValue)
	end)
end

local function GetPlayerDataHandler()
	for _, child in game:GetService("ServerScriptService"):GetDescendants() do
		if child.Name == "PlayerDataHandler" and child:IsA("ModuleScript") then
			return child
		end
	end
	error("Could not find PlayerDataHandler Module script. You sure it exists and is in ServerScriptService somewhere?")
	return nil
end

function ProfileServerValue<T>(valueName: string, profileServiceKey: string)
	if RunService:IsClient() then
		error(`Cannot use Profile Server Value on the Client`)
		return
	end

	if profileServiceKey == nil then
		error(`Must provide profileServiceKey string to ProfileServerValue on the server for {valueName}`)
		return
	end

	local DataHandler = require(GetPlayerDataHandler())
	if not WeaveUtils.MethodExists(DataHandler, "GetProfileTemplate") then
		error([[GetProfileTemplate method not found in DataHandler.
    Make sure DataHandler module implements the GetProfileTemplate method:
    function PlayerDataHandler:GetProfileTemplate()
		return Profile
	end
    	]])
		return
	end
	if not WeaveUtils.MethodExists(DataHandler, "Set") then
		error(
			`Set method not found in DataHandler. Ensure the PlayerDataHandler Module script implements the Set method`
		)
		return
	end
	if not WeaveUtils.MethodExists(DataHandler, "GetAsync") then
		error(
			`GetAsync method not found in DataHandler. Ensure the PlayerDataHandler Module script implements the GetAsync method`
		)
		return
	end

	local initialValue = DataHandler:GetProfileTemplate()[profileServiceKey]
	if initialValue == nil then
		error(
			`Profile template object must have {profileServiceKey}. Did you add the key {profileServiceKey} to the ProfileService Profile?`
		)
		return
	end

	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_profileServiceKey = profileServiceKey,
		_dataHandler = DataHandler,
		_name = valueName,
		_isLoaded = {},
		_value = initialValue,
		_fusionValue = Value(initialValue),
		_troves = {},
	}, CLASS_METATABLE)

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
	end

	return self
end

return ProfileServerValue
