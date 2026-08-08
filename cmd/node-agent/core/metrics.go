// Copyright 2026 Woodpecker Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package core

import (
	"bufio"
	"net"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"golang.org/x/sys/unix"
)

// readCPUUsage computes a one-shot CPU usage percentage (0-100).
// Linux: /proc/stat deltas; other platforms: 0 (heartbeat still carries load).
func readCPUUsage() float64 {
	if runtime.GOOS != "linux" {
		return 0
	}
	a := cpuJiffies()
	if len(a) < 5 {
		return 0
	}
	time.Sleep(200 * time.Millisecond)
	b := cpuJiffies()
	if len(b) < 5 {
		return 0
	}
	total := uint64(0)
	idle := uint64(0)
	for i := range a {
		if i < len(b) {
			total += b[i] - a[i]
		}
	}
	idle = b[3] + b[4] - (a[3] + a[4]) // idle + iowait
	if total == 0 {
		return 0
	}
	usage := (1 - float64(idle)/float64(total)) * 100
	if usage < 0 {
		return 0
	}
	if usage > 100 {
		return 100
	}
	return usage
}

// cpuJiffies reads the aggregate /proc/stat line as [user nice system idle iowait ...].
func cpuJiffies() []uint64 {
	f, err := os.Open("/proc/stat")
	if err != nil {
		return nil
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	if !scanner.Scan() {
		return nil
	}
	fields := strings.Fields(scanner.Text())
	if len(fields) < 5 || fields[0] != "cpu" {
		return nil
	}
	out := make([]uint64, 0, len(fields)-1)
	for _, field := range fields[1:] {
		v, _ := strconv.ParseUint(field, 10, 64)
		out = append(out, v)
	}
	return out
}

// readMemoryUsage returns used memory as a percentage (Linux: /proc/meminfo).
func readMemoryUsage() float64 {
	if runtime.GOOS != "linux" {
		return 0
	}
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0
	}
	defer f.Close()

	var total, available uint64
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		v, _ := strconv.ParseUint(fields[1], 10, 64)
		switch strings.TrimSuffix(fields[0], ":") {
		case "MemTotal":
			total = v
		case "MemAvailable":
			available = v
		}
	}
	if total == 0 {
		return 0
	}
	return float64(total-available) / float64(total) * 100
}

// readDiskUsage returns the root filesystem usage percentage via statfs.
func readDiskUsage() float64 {
	var stat unix.Statfs_t
	if err := unix.Statfs("/", &stat); err != nil {
		return 0
	}
	blocks := float64(stat.Blocks)
	if blocks == 0 {
		return 0
	}
	free := float64(stat.Bavail)
	return (1 - free/blocks) * 100
}

// readLoadAvg returns the 1-minute load average (Linux: /proc/loadavg).
func readLoadAvg() float64 {
	if runtime.GOOS != "linux" {
		return 0
	}
	data, err := os.ReadFile("/proc/loadavg")
	if err != nil {
		return 0
	}
	fields := strings.Fields(string(data))
	if len(fields) == 0 {
		return 0
	}
	v, _ := strconv.ParseFloat(fields[0], 64)
	return v
}

// localIP returns the first non-loopback IPv4 address.
func localIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() && ipNet.IP.To4() != nil {
			return ipNet.IP.String()
		}
	}
	return ""
}
