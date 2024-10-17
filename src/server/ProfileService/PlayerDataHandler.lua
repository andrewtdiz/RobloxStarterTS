local ServerScriptService = game:GetService("ServerScriptService")

local PlayerDataHandler = {}

local Profile = require(ServerScriptService.ProfileServiceReqs.Profile)

local ProfileStore = require(ServerScriptService.ProfileServiceReqs.ProfileStore)
local Players = game:GetService("Players")
local PROD_PLAYERPROFILE = "PROD-PlayerProfile"
local BETA_PLAYERPROFILE = "PlayerProfile"

local RunService = game:GetService("RunService")
local isProd = not RunService:IsStudio()

local PlayerStore = ProfileStore.New(if isProd then PROD_PLAYERPROFILE else BETA_PLAYERPROFILE, Profile)

local WAIT_DURATION = 10000

local Profiles = {}

local function PlayerAdded(player: Player)
	local profile
	if RunService:IsStudio() then
		PlayerStore = PlayerStore.Mock
	end
	while player.Parent == Players and ProfileStore.IsClosing == false do
		profile = PlayerStore:StartSessionAsync(`{player.UserId}`, {
			Cancel = function()
				return player.Parent ~= Players
			end,
		})
		if profile ~= nil then
			break
		end
	end

	if profile ~= nil then
		profile:AddUserId(player.UserId)
		profile:Reconcile()

		profile.OnSessionEnd:Connect(function()
			Profiles[player] = nil
			player:Kick(`Profile session end - Please rejoin`)
		end)

		if player.Parent == Players then
			Profiles[player] = profile
		else
			profile:EndSession()
		end
	else
		player:Kick(`Profile load fail - Please rejoin`)
	end
end

function PlayerDataHandler:Init()
	for _, player in Players:GetPlayers() do
		task.spawn(PlayerAdded, player)
	end

	Players.PlayerAdded:Connect(PlayerAdded)

	Players.PlayerRemoving:Connect(function(player)
		local profile = Profiles[player]
		if profile ~= nil then
			profile:EndSession()
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

function PlayerDataHandler:_GetAsync(player: Player, key: string)
	local now = DateTime.now().UnixTimestampMillis
	while DateTime.now().UnixTimestampMillis - now < WAIT_DURATION do
		if getProfile(player) ~= nil then
			break
		end
		task.wait()
	end

	local profile = getProfile(player)
	assert(profile.Data[key] ~= nil, `Data does not exist for key {key}`)

	return profile.Data[key]
end

function PlayerDataHandler:Set(player: Player, key: string, value: any)
	local profile = getProfile(player)
	assert(profile.Data[key] ~= nil, `Data does not exist for key {key}`)

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
