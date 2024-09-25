local PlayerDataHandler = {}

local Profile = require(script.Parent.ProfileTemplate)

local ProfileService = require(script.Parent.ProfileService)
local Players = game:GetService("Players")
local PROD_PLAYERPROFILE = "PROD-PlayerProfile"
local BETA_PLAYERPROFILE = "PlayerProfile"

local RunService = game:GetService("RunService")
local isProd = not RunService:IsStudio()

local ProfileStore = ProfileService.GetProfileStore(if isProd then PROD_PLAYERPROFILE else BETA_PLAYERPROFILE, Profile)

local WAIT_DURATION = 10000

local Profiles = {}

local function playerAdded(player: Player)
	local profile
	if script:GetAttribute("mock") and RunService:IsStudio() then
		profile = ProfileStore.Mock:LoadProfileAsync(`Player_{player.UserId}`)
	else
		profile = ProfileStore:LoadProfileAsync(`Player_{player.UserId}`)
	end

	if profile ~= nil then
		profile:AddUserId(player.UserId)
		profile:Reconcile()

		profile:ListenToRelease(function()
			Profiles[player] = nil

			player:Kick()
		end)

		if not player:IsDescendantOf(Players) then
			profile:Release()
		else
			Profiles[player] = profile
		end
	else
		player:Kick()
	end
end

function PlayerDataHandler:Init()
	for _, player in Players:GetPlayers() do
		task.spawn(playerAdded, player)
	end

	Players.PlayerAdded:Connect(playerAdded)
	Players.PlayerRemoving:Connect(function(player)
		if Profiles[player] then
			Profiles[player]:Release()
		end
	end)
end

local function getProfile(player: Player)
	return Profiles[player]
end

function PlayerDataHandler:GetProfileTemplate()
	return Profile
end

function PlayerDataHandler:GetAsync(player: Player, key: string)
	return self:_GetAsync(player, key)
end

function PlayerDataHandler:_GetProfile(player: Player)
	local now = DateTime.now().UnixTimestampMillis
	while DateTime.now().UnixTimestampMillis - now < WAIT_DURATION do
		if getProfile(player) ~= nil then
			break
		end
		task.wait()
	end
	local profile = getProfile(player)
	return profile.Data
end

function PlayerDataHandler:_ClearProfile(player: Player)
	local now = DateTime.now().UnixTimestampMillis
	while DateTime.now().UnixTimestampMillis - now < WAIT_DURATION do
		if getProfile(player) ~= nil then
			break
		end
		task.wait()
	end
	local profile = getProfile(player)
	profile.Data = self:GetProfileTemplate()
end

function PlayerDataHandler:_GetAsync(player: Player, key: string)
	local now = DateTime.now().UnixTimestampMillis
	while DateTime.now().UnixTimestampMillis - now < WAIT_DURATION do
		if getProfile(player) ~= nil then
			break
		end
		task.wait()
	end

	local profile = getProfile(player)

	assert(profile.Data[key], `Data does not exist for key {key}`)
	warn(profile.Data[key], key)
	return profile.Data[key]
end

function PlayerDataHandler:Set(player: Player, key: string, value: any)
	local profile = getProfile(player)
	assert(profile.Data[key], `Data does not exist for key {key}`)

	assert(
		type(profile.Data[key]) == type(value),
		`Value {value} of type {type(value)} is not of expected type {type(profile.Data[key])}`
	)
	profile.Data[key] = value
end

function PlayerDataHandler:_Update(player: Player, key: string, callback: () -> any)
	local oldData = self:_GetAsync(player, key)
	local newData = callback(oldData)

	self:Set(player, key, newData)
end

PlayerDataHandler:Init()

return PlayerDataHandler
