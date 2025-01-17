﻿using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;

namespace src
{
    public class LidarHub : Hub
    {

        public ChannelReader<int> Counter(
        int count,
        int delay,
        CancellationToken cancellationToken)
        {
            var channel = Channel.CreateUnbounded<int>();

            // We don't want to await WriteItemsAsync, otherwise we'd end up waiting 
            // for all the items to be written before returning the channel back to
            // the client.
            _ = WriteItemsAsync(channel.Writer, count, delay, cancellationToken);

            return channel.Reader;
        }

        private async Task WriteItemsAsync(
    ChannelWriter<int> writer,
    int count,
    int delay,
    CancellationToken cancellationToken)
        {
            Exception localException = null;
            try
            {
                for (var i = 0; i < count; i++)
                {
                    await writer.WriteAsync(i, cancellationToken);

                    // Use the cancellationToken in other APIs that accept cancellation
                    // tokens so the cancellation can flow down to them.
                    await Task.Delay(delay, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                localException = ex;
            }

            writer.Complete(localException);
        }

        public async Task RetrieveLidatafromServer(string message)
        {
            await Clients.All.SendAsync("RetrieveData", message);
        }

        public async Task UploadStreamLiDARData(ChannelReader<string> stream)
        {
            while (await stream.WaitToReadAsync())
            {
                while (stream.TryRead(out var item))
                {
                    // do something with the stream item
                    //Console.WriteLine(item);
                    // string lidarjson = JsonConvert.SerializeObject(item);
                    dynamic json = JsonConvert.DeserializeObject(item);
                    string lidarjson = JsonConvert.SerializeObject(json);
                    await SendLidarData(lidarjson);
                    //await SendMessage(item);
                }
            }
        }

        public async Task SendLidarData(string lidardata)
        {
            //Thread.Sleep(1000);
            await Clients.All.SendAsync("ReceiveLidarData", lidardata);
        }
    }
}
