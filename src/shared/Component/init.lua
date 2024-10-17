local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CollectionService = game:GetService("CollectionService")
local StarterGui = game:GetService("StarterGui")

local Component = {}

local loaded = {}

function Component.Create(Tag: string, func: () -> nil)
	local InstanceMap = {}

	local collection = CollectionService:GetTagged(Tag)

	for _, instance in collection do
		if instance:IsDescendantOf(ReplicatedStorage) or instance:IsDescendantOf(StarterGui) then
			continue
		end

		task.spawn(function()
			local returnValue = func(instance)
			if type(returnValue) == "function" then
				InstanceMap[instance] = returnValue
			end
		end)
	end

	CollectionService:GetInstanceAddedSignal(Tag):Connect(function(instance: Instance)
		if instance:IsDescendantOf(ReplicatedStorage) or instance:IsDescendantOf(StarterGui) then
			return
		end

		task.spawn(function()
			local returnValue = func(instance)
			if type(returnValue) == "function" then
				InstanceMap[instance] = returnValue
			end
		end)
	end)

	CollectionService:GetInstanceRemovedSignal(Tag):Connect(function(instance: Instance)
		if instance:IsDescendantOf(ReplicatedStorage) or instance:IsDescendantOf(StarterGui) then
			return
		end

		if InstanceMap[instance] and type(InstanceMap[instance]) == "function" then
			InstanceMap[instance]()
			InstanceMap[instance] = nil
		end
	end)
end

local function setupComponent(desc: Instance)
	if desc:IsA("ModuleScript") then
		local func = require(desc)
		local TagName = desc.Name:sub(2)

		if loaded[TagName] then
			warn(`{TagName} already loaded`)
			return
		end

		loaded[TagName] = true
		Component.Create(desc.Name:sub(2), func)
	elseif desc:IsA("Folder") then
		local folderIsComponent = desc.Name:sub(1, 1) == "_"

		for _, child in desc:GetChildren() do
			local componentName = if folderIsComponent then desc.Name else child.Name
			local TagName = componentName:sub(2)

			if loaded[TagName] then
				warn(`{TagName} already loaded`)
				return
			end

			loaded[TagName] = true

			local func = require(child)
			Component.Create(TagName, func)
		end
	end
end

function Component.Init(ComponentsFolder: Folder)
	assert(ComponentsFolder:IsA("Folder"), `{ComponentsFolder} provided is not a Folder`)

	for _, child in ComponentsFolder:GetChildren() do
		task.spawn(setupComponent, child)
	end
end

local RunService = game:GetService("RunService")

if RunService:IsClient() then
	repeat
		task.wait()
	until game:IsLoaded()
end

return Component
