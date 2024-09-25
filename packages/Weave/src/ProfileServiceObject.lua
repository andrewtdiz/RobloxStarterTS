local ProfileServiceObject = {}
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local CLASS_METATABLE = {__index = ProfileServiceObject}
local WEAK_KEYS_METATABLE = {__mode = "k"}
local WeaveUtils = require(script.Parent.WeaveUtils)
local WeaveValue = require(script.Parent.WeaveValue)

function ProfileServiceObject:getNow()
	if RunService:IsClient() then
		error("Cannot use getNow on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._playerObject:getNow()
end

function ProfileServiceObject:getNowFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getNowFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._playerObject:getNow()[player]
end

function ProfileServiceObject:getFor(player: Player)
	if RunService:IsClient() then
		error("Cannot use getFor on the client. Try using get() for the value or Fusion() for the fusion value")
		return
	end
	return self._playerObject:get()[player]
end

function ProfileServiceObject:Fusion()
	return self._playerObject:Fusion()
end

function ProfileServiceObject:setFor(player: Player, newValue: any, force: boolean)
	if RunService:IsClient() then
		error("Cannot set ProfileServiceObject value on the client. Only the Server")
		return
	end
	local tempObject = self._playerObject:getNow()
	tempObject[player] = newValue
	self._playerObject:set(tempObject, force)
	task.spawn(function()
		self._dataHandler:Set(player, self._profileServiceKey, newValue)
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

function ProfileServiceObject:_PlayerAdded(player: Player)
	if not RunService:IsServer() then return end
	print(player)
	local fusionValue = self._playerObject:getNow()
	fusionValue[player] = self._initialValue
	self._playerObject:set(fusionValue)
	local newValue = self._dataHandler:GetAsync(player, self._profileServiceKey)
	fusionValue = self._playerObject:getNow()
	fusionValue[player] = newValue
	self._playerObject:set(fusionValue)
end

function ProfileServiceObject:_PlayerRemoving(player: Player)
	if not RunService:IsServer() then return end
	local fusionValue = self._playerObject:get()
	fusionValue[player] = nil
	self._playerObject:set(fusionValue)
end

function ProfileServiceObject<T>(valueName: string, profileServiceKey: string?)
	
	if RunService:IsClient() then
		return WeaveValue(`profileServiceObject_{valueName}`)
	end
	
	if profileServiceKey == nil then 
		error(`Must provide profileServiceKey string to ProfileServiceObject on the server for {valueName}`)
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
		error(`Set method not found in DataHandler. Ensure the PlayerDataHandler Module script implements the Set method`)
		return	
	end
	if not WeaveUtils.MethodExists(DataHandler, "GetAsync") then
		error(`GetAsync method not found in DataHandler. Ensure the PlayerDataHandler Module script implements the GetAsync method`)
		return	
	end

	local initialValue = DataHandler:GetProfileTemplate()[profileServiceKey]
	if initialValue == nil then
		error(`Profile template object must have {profileServiceKey}. Did you add the key {profileServiceKey} to the ProfileService Profile?`)
		return
	end
	
	local self = setmetatable({
		type = "State",
		kind = "Value",
		-- if we held strong references to the dependents, then they wouldn't be
		-- able to get garbage collected when they fall out of scope
		dependentSet = setmetatable({}, WEAK_KEYS_METATABLE),
		_initialValue = initialValue,
		_profileServiceKey = profileServiceKey,
		_dataHandler = DataHandler,
		_name = valueName,
		_playerObject = WeaveValue(`profileServiceObject_{valueName}`, {}),
		_troves = {}
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


return ProfileServiceObject
